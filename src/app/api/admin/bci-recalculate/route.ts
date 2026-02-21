import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBCI } from "@/lib/bci";
import { getBCIWeights } from "@/lib/bci-weights";
import { adminHandler } from "@/lib/admin-handler";

export const POST = adminHandler(async () => {
  const weights = await getBCIWeights();
  const videos = await prisma.video.findMany();

  const updates = videos
    .map((video) => {
      const bci = calculateBCI(
        {
          durationMin: video.durationMin,
          hasCc: video.hasCc,
          hasChapters: video.hasChapters,
          difficulty: video.difficulty as "easy" | "normal" | "hard",
          publishedAt: video.publishedAt,
          hasSampleCode: video.hasSampleCode,
          likeRatio: video.likeRatio,
        },
        weights
      );
      return { id: video.id, bci, changed: bci !== video.beginnerComfortIndex };
    })
    .filter((u) => u.changed);

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.video.update({
          where: { id: u.id },
          data: { beginnerComfortIndex: u.bci },
        })
      )
    );
  }

  return NextResponse.json({ updated: updates.length, total: videos.length });
}, "Failed to recalculate BCI");
