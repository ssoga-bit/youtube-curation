/**
 * One-off script to auto-summarize all videos without transcriptSummary.
 * Usage: npx tsx scripts/batch-summarize.ts
 */
import { PrismaClient } from "@prisma/client";
import { autoSummarize } from "../src/lib/auto-summarize";

async function main() {
  const prisma = new PrismaClient();

  try {
    const videos = await prisma.video.findMany({
      where: { transcriptSummary: null },
      select: { id: true, url: true, title: true },
    });

    if (videos.length === 0) {
      console.log("All videos already have summaries. Nothing to do.");
      return;
    }

    console.log(`Found ${videos.length} video(s) without summaries. Starting...`);

    // Process sequentially to avoid rate-limiting
    for (const video of videos) {
      console.log(`[${video.id}] Summarizing: ${video.title}`);
      await autoSummarize(video.id, video.url, video.title);
    }

    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
