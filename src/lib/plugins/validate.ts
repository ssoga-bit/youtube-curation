import type { LLMSummaryResult } from "@/lib/llm";

/**
 * Normalize and apply defaults to a parsed LLM result.
 * Never throws — invalid fields are replaced with safe defaults.
 */
export function validateSummaryResult(
  parsed: Record<string, unknown>,
  fallbackTitle: string
): LLMSummaryResult {
  return {
    transcriptSummary:
      typeof parsed.transcriptSummary === "string" && parsed.transcriptSummary
        ? parsed.transcriptSummary
        : fallbackTitle,
    glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [],
    difficulty: isValidDifficulty(parsed.difficulty)
      ? parsed.difficulty
      : "normal",
    deprecatedFlags: Array.isArray(parsed.deprecatedFlags)
      ? parsed.deprecatedFlags
      : [],
    prerequisites:
      typeof parsed.prerequisites === "string" && parsed.prerequisites
        ? parsed.prerequisites
        : "不要",
    learnings: Array.isArray(parsed.learnings) ? parsed.learnings : [],
  };
}

function isValidDifficulty(
  value: unknown
): value is "easy" | "normal" | "hard" {
  return value === "easy" || value === "normal" || value === "hard";
}
