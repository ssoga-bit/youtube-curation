import { prisma } from "@/lib/prisma";
import { extractVideoId, fetchTranscript } from "@/lib/youtube";
import { generateVideoSummary } from "@/lib/llm";
import { calculateBCI } from "@/lib/bci";
import { getBCIWeights } from "@/lib/bci-weights";

/**
 * Automatically fetch transcript, generate LLM summary, and update DB.
 * Designed for fire-and-forget usage after video import.
 * Never throws — all errors are logged and swallowed.
 */
export async function autoSummarize(
  videoId: string,
  url: string,
  title: string
): Promise<void> {
  try {
    // 1. Extract YouTube ID
    const ytId = extractVideoId(url);
    if (!ytId) {
      console.error(`[autoSummarize] Failed to extract YouTube ID from: ${url}`);
      return;
    }

    // 2. Fetch transcript
    const transcript = await fetchTranscript(ytId);
    if (!transcript) {
      console.error(`[autoSummarize] No transcript found for: ${ytId}`);
      return;
    }

    // 3. Generate LLM summary
    const result = await generateVideoSummary(title, transcript);

    // 4. Fetch current video to get BCI factors
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      console.error(`[autoSummarize] Video not found: ${videoId}`);
      return;
    }

    // 5. Recalculate BCI with new difficulty
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

    // 6. Update DB
    await prisma.video.update({
      where: { id: videoId },
      data: {
        transcriptSummary: result.transcriptSummary,
        glossary: JSON.stringify(result.glossary),
        difficulty: result.difficulty,
        deprecatedFlags: JSON.stringify(result.deprecatedFlags),
        prerequisites: result.prerequisites || null,
        learnings: JSON.stringify(result.learnings || []),
        beginnerComfortIndex: bci,
      },
    });

    console.log(`[autoSummarize] Successfully summarized video: ${videoId}`);
  } catch (error) {
    console.error(`[autoSummarize] Failed for video ${videoId}:`, error);
  }
}
