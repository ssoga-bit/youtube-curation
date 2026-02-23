import { NextRequest, NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-handler";
import { prisma } from "@/lib/prisma";
import { calculateBCI } from "@/lib/bci";
import { getBCIWeights } from "@/lib/bci-weights";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube";
import { importBodySchema, validateBody, ImportVideoInput } from "@/lib/validations";
import { autoSummarize } from "@/lib/auto-summarize";

interface ImportVideo {
  url: string;
  title?: string;
  channel?: string;
  language?: string;
  durationMin?: number;
  publishedAt?: string;
  tags?: string[];
  memo?: string;
  rating?: number;
}

export const POST = adminHandler(async function POST(request: NextRequest) {
    const body = await request.json();
    const validation = validateBody(importBodySchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.details },
        { status: 400 }
      );
    }

    const videos: ImportVideo[] = Array.isArray(validation.data)
      ? validation.data
      : validation.data.videos;

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json(
        { error: "Request body must contain an array of videos" },
        { status: 400 }
      );
    }

    // Deduplicate by URL within the import batch
    const uniqueByUrl = new Map<string, ImportVideo>();
    for (const video of videos) {
      if (video.url) {
        uniqueByUrl.set(video.url, video);
      }
    }

    const weights = await getBCIWeights();

    const summarizeTargets: { id: string; url: string; title: string }[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const video of Array.from(uniqueByUrl.values())) {
      let { title, channel, language, durationMin, publishedAt, tags } = video;
      let hasCc = false;
      let hasChapters = false;

      // Auto-fill metadata from YouTube API when fields are missing
      if (!title || !durationMin) {
        const ytId = extractVideoId(video.url);
        if (ytId) {
          const meta = await fetchVideoMeta(ytId);
          if (meta) {
            title = title || meta.title;
            channel = channel || meta.channel;
            language = language || meta.language;
            durationMin = durationMin || meta.durationMin;
            publishedAt = publishedAt || meta.publishedAt;
            tags = tags && tags.length > 0 ? tags : meta.tags;
            hasCc = meta.hasCc;
            hasChapters = meta.hasChapters;
          }
        }
      }

      // Skip if title or durationMin is still missing after YouTube lookup
      if (!title || !durationMin) {
        skipped++;
        continue;
      }

      const resolvedLanguage = language || "ja";
      const resolvedPublishedAt = new Date(publishedAt || new Date().toISOString());
      const resolvedTags = tags || [];
      const tagsJson = JSON.stringify(resolvedTags);

      // Map 1-5 rating to 0-1 qualityScore
      const qualityScore = video.rating
        ? Math.max(0, Math.min(1, (video.rating - 1) / 4))
        : 0;

      // Determine difficulty from rating
      let difficulty: "easy" | "normal" | "hard" = "easy";
      if (video.rating && video.rating <= 2) {
        difficulty = "hard";
      } else if (video.rating && video.rating <= 3) {
        difficulty = "normal";
      }

      // Calculate BCI
      const bci = calculateBCI(
        {
          durationMin,
          hasCc,
          hasChapters,
          difficulty,
          publishedAt: resolvedPublishedAt,
          hasSampleCode: false,
          likeRatio: 0,
        },
        weights
      );

      const data = {
        title,
        channel: channel || "",
        language: resolvedLanguage,
        durationMin,
        publishedAt: resolvedPublishedAt,
        tags: tagsJson,
        hasCc,
        hasChapters,
        sourceNotes: video.memo || null,
        qualityScore,
        difficulty,
        beginnerComfortIndex: bci,
      };

      const existing = await prisma.video.findUnique({
        where: { url: video.url },
      });

      if (existing) {
        await prisma.video.update({
          where: { url: video.url },
          data,
        });
        // 要約がまだない既存動画も自動要約の対象にする
        if (!existing.transcriptSummary) {
          summarizeTargets.push({ id: existing.id, url: video.url, title: data.title });
        }
        updated++;
      } else {
        const newVideo = await prisma.video.create({
          data: { url: video.url, ...data },
        });
        summarizeTargets.push({ id: newVideo.id, url: video.url, title: data.title });
        created++;
      }
    }

    // Fire-and-forget: auto-summarize videos without summaries in the background
    if (summarizeTargets.length > 0) {
      Promise.allSettled(
        summarizeTargets.map((v) => autoSummarize(v.id, v.url, v.title))
      );
    }

    return NextResponse.json({
      created,
      updated,
      skipped,
      total: created + updated,
    });
}, "Failed to import videos");
