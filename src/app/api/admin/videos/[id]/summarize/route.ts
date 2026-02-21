import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVideoSummary } from "@/lib/llm";
import { calculateBCI } from "@/lib/bci";
import { getBCIWeights } from "@/lib/bci-weights";
import { parseVideoJson } from "@/lib/parse";
import { adminHandler } from "@/lib/admin-handler";
import { summarizeSchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = adminHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = validateBody(summarizeSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const { transcript } = validation.data;

  // 1. Fetch video by id to get title
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // 2. Call generateVideoSummary
  const result = await generateVideoSummary(video.title, transcript);

  // 3. Update video with result
  const updateData: Record<string, unknown> = {
    transcriptSummary: result.transcriptSummary,
    glossary: JSON.stringify(result.glossary),
    difficulty: result.difficulty,
    deprecatedFlags: JSON.stringify(result.deprecatedFlags),
    prerequisites: result.prerequisites || null,
    learnings: JSON.stringify(result.learnings || []),
  };

  // 4. Recalculate BCI with new difficulty
  const weights = await getBCIWeights();
  const bci = calculateBCI(
    {
      durationMin: video.durationMin,
      hasCc: video.hasCc,
      hasChapters: video.hasChapters,
      difficulty: result.difficulty,
      publishedAt: new Date(video.publishedAt),
      hasSampleCode: video.hasSampleCode,
      likeRatio: video.likeRatio,
    },
    weights
  );
  updateData.beginnerComfortIndex = bci;

  const updated = await prisma.video.update({
    where: { id },
    data: updateData,
  });

  // 5. Return updated video and LLM result
  return NextResponse.json({
    video: parseVideoJson(updated as unknown as Record<string, unknown>),
    llmResult: result,
  });
}, "Failed to generate summary");
