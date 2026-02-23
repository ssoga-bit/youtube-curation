import type { LLMSummaryResult } from "@/lib/llm";

export interface SummarizerInput {
  videoTitle: string;
  transcript: string;
}

export interface SummarizerPlugin {
  readonly name: string;
  readonly key: string;
  summarize(
    input: SummarizerInput,
    config: Record<string, string>
  ): Promise<LLMSummaryResult>;
}

export interface SummarizerPluginConfig {
  activePlugin: string;
  pluginConfigs: Record<string, Record<string, string>>;
}
