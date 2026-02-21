import type { LLMSummaryResult } from "@/lib/llm";
import type { SummarizerPlugin, SummarizerInput, PluginConfigField } from "./types";
import { validateSummaryResult } from "./validate";

export const difyPlugin: SummarizerPlugin = {
  name: "Dify Workflow",
  key: "dify",
  configSchema: [
    {
      key: "endpoint",
      label: "Endpoint URL",
      type: "url",
      required: true,
      placeholder: "https://api.dify.ai/v1",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: true,
      placeholder: "app-...",
    },
  ] satisfies PluginConfigField[],

  async summarize(
    input: SummarizerInput,
    config: Record<string, string>
  ): Promise<LLMSummaryResult> {
    if (!config.endpoint) {
      throw new Error("Dify endpoint is required");
    }
    if (!config.apiKey) {
      throw new Error("Dify API key is required");
    }

    const url = `${config.endpoint.replace(/\/+$/, "")}/workflows/run`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          video_title: input.videoTitle,
          transcript: input.transcript,
        },
        response_mode: "blocking",
        user: "youtube-curation",
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Dify API error: ${response.status} ${response.statusText} ${text}`
      );
    }

    const data = await response.json();
    const outputs = data.data?.outputs ?? data.outputs ?? data;

    const parsed = parseOutputs(outputs, input.videoTitle);
    return validateSummaryResult(parsed, input.videoTitle);
  },
};

/**
 * Parse Dify outputs in 3 supported patterns:
 * 1. outputs is a direct object with the expected fields
 * 2. outputs is a JSON string
 * 3. outputs.result contains a JSON string
 */
function parseOutputs(
  outputs: unknown,
  fallbackTitle: string
): Record<string, unknown> {
  if (!outputs || typeof outputs !== "object") {
    if (typeof outputs === "string") {
      return JSON.parse(outputs);
    }
    return { transcriptSummary: fallbackTitle };
  }

  const obj = outputs as Record<string, unknown>;

  // Pattern 1: direct object with expected fields
  if (obj.transcriptSummary !== undefined) {
    return obj;
  }

  // Pattern 3: outputs.result is a JSON string
  if (typeof obj.result === "string") {
    return JSON.parse(obj.result);
  }

  // Pattern 2: try treating the whole object as the result
  return obj;
}
