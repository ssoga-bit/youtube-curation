import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoSummarize } from "@/lib/auto-summarize";
import { adminHandler } from "@/lib/admin-handler";

export const POST = adminHandler(async (_request: Request) => {
  const videos = await prisma.video.findMany({
    where: { transcriptSummary: null },
    select: { id: true, url: true, title: true },
  });

  if (videos.length === 0) {
    return NextResponse.json({ queued: 0, message: "All videos already have summaries" });
  }

  // Fire-and-forget: run all summarizations in the background
  Promise.allSettled(
    videos.map((v) => autoSummarize(v.id, v.url, v.title))
  );

  return NextResponse.json({ queued: videos.length });
}, "Failed to batch summarize");
