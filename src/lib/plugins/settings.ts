import type { SummarizerPluginConfig } from "./types";

/**
 * Build summarizer plugin settings from environment variables.
 */
export async function getSummarizerConfig(): Promise<SummarizerPluginConfig> {
  const activePlugin = process.env.SUMMARIZER_PLUGIN || "dify";
  return {
    activePlugin,
    pluginConfigs: {
      dify: {
        endpoint: process.env.DIFY_ENDPOINT || "",
        apiKey: process.env.DIFY_API_KEY || "",
      },
      claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || "",
        model: process.env.CLAUDE_MODEL || "",
      },
    },
  };
}
