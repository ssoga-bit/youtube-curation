import { describe, it, expect } from "vitest";
import { validateSummaryResult } from "./validate";

describe("validateSummaryResult", () => {
  it("returns valid result unchanged", () => {
    const input = {
      transcriptSummary: "要約テキスト",
      glossary: [{ term: "API", explain: "接続口" }],
      difficulty: "easy",
      deprecatedFlags: ["注意点"],
      prerequisites: "基礎知識",
      learnings: ["学び1"],
    };
    const result = validateSummaryResult(input, "フォールバック");
    expect(result).toEqual(input);
  });

  it("defaults missing transcriptSummary to fallback title", () => {
    const result = validateSummaryResult({}, "フォールバック");
    expect(result.transcriptSummary).toBe("フォールバック");
  });

  it("defaults empty transcriptSummary to fallback title", () => {
    const result = validateSummaryResult({ transcriptSummary: "" }, "タイトル");
    expect(result.transcriptSummary).toBe("タイトル");
  });

  it("defaults non-array glossary to empty array", () => {
    const result = validateSummaryResult(
      { glossary: "not array" },
      "タイトル"
    );
    expect(result.glossary).toEqual([]);
  });

  it("defaults non-array deprecatedFlags to empty array", () => {
    const result = validateSummaryResult(
      { deprecatedFlags: 123 },
      "タイトル"
    );
    expect(result.deprecatedFlags).toEqual([]);
  });

  it("defaults non-array learnings to empty array", () => {
    const result = validateSummaryResult(
      { learnings: { key: "val" } },
      "タイトル"
    );
    expect(result.learnings).toEqual([]);
  });

  it("defaults invalid difficulty to normal", () => {
    const result = validateSummaryResult(
      { difficulty: "super-hard" },
      "タイトル"
    );
    expect(result.difficulty).toBe("normal");
  });

  it("defaults missing difficulty to normal", () => {
    const result = validateSummaryResult({}, "タイトル");
    expect(result.difficulty).toBe("normal");
  });

  it("accepts easy difficulty", () => {
    const result = validateSummaryResult({ difficulty: "easy" }, "タイトル");
    expect(result.difficulty).toBe("easy");
  });

  it("accepts hard difficulty", () => {
    const result = validateSummaryResult({ difficulty: "hard" }, "タイトル");
    expect(result.difficulty).toBe("hard");
  });

  it("defaults missing prerequisites to 不要", () => {
    const result = validateSummaryResult({}, "タイトル");
    expect(result.prerequisites).toBe("不要");
  });

  it("defaults empty prerequisites to 不要", () => {
    const result = validateSummaryResult({ prerequisites: "" }, "タイトル");
    expect(result.prerequisites).toBe("不要");
  });

  it("applies all defaults for empty input", () => {
    const result = validateSummaryResult({}, "タイトル");
    expect(result).toEqual({
      transcriptSummary: "タイトル",
      glossary: [],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });
  });
});
