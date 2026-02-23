import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVideoJson } from "@/lib/parse";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video || !video.isPublished) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const parsed = parseVideoJson(video as unknown as Record<string, unknown>);
    const videoTags = parsed.tags as string[];

    // Find related videos with overlapping tags (max 6)
    let relatedVideos: Record<string, unknown>[] = [];
    if (videoTags.length > 0) {
      const candidates = await prisma.video.findMany({
        where: {
          isPublished: true,
          id: { not: id },
          OR: videoTags.map((tag: string) => ({
            tags: { contains: tag },
          })),
        },
        take: 6,
        orderBy: { beginnerComfortIndex: "desc" },
      });
      relatedVideos = candidates.map((v) =>
        parseVideoJson(v as unknown as Record<string, unknown>)
      );
    }

    return NextResponse.json({ video: parsed, relatedVideos });
  } catch (error) {
    console.error("GET /api/videos/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}
