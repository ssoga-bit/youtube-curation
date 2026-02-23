import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/tags
 * Returns unique tags from all published videos, sorted by frequency.
 */
export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      where: { isPublished: true },
      select: { tags: true },
    });

    const tagCount = new Map<string, number>();
    for (const video of videos) {
      try {
        const parsed = JSON.parse(video.tags);
        if (Array.isArray(parsed)) {
          for (const tag of parsed) {
            if (typeof tag === "string" && tag.trim()) {
              const normalized = tag.trim().toLowerCase();
              tagCount.set(normalized, (tagCount.get(normalized) || 0) + 1);
            }
          }
        }
      } catch {
        // skip invalid JSON
      }
    }

    const tags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    return NextResponse.json({ tags }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
