import { getSummarizerConfig } from "@/lib/plugins/settings";
import { getPlugin } from "@/lib/plugins/registry";

export interface LLMSummaryResult {
  transcriptSummary: string;
  glossary: { term: string; explain: string }[];
  difficulty: "easy" | "normal" | "hard";
  deprecatedFlags: string[];
  prerequisites: string;
  learnings: string[];
}

/**
 * Generate summary from transcript text using the active summarizer plugin.
 * Signature is unchanged for backward compatibility.
 */
export async function generateVideoSummary(
  videoTitle: string,
  transcript: string
): Promise<LLMSummaryResult> {
  try {
    const config = await getSummarizerConfig();
    const plugin = getPlugin(config.activePlugin);

    if (!plugin) {
      throw new Error(`Unknown summarizer plugin: ${config.activePlugin}`);
    }

    const pluginConfig = config.pluginConfigs[plugin.key] ?? {};
    return await plugin.summarize({ videoTitle, transcript }, pluginConfig);
  } catch (error) {
    console.error("LLM summary generation failed:", error);

    return {
      transcriptSummary: videoTitle,
      glossary: [],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    };
  }
}
