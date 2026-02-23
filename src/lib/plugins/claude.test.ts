import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      constructor(public opts?: { apiKey?: string }) {}
      messages = { create: mockCreate };
    },
  };
});

import { claudePlugin } from "./claude";

describe("claudePlugin", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("has correct metadata", () => {
    expect(claudePlugin.key).toBe("claude");
    expect(claudePlugin.name).toBe("Claude (Direct API)");
  });

  it("returns parsed JSON result on success", async () => {
    const llmResponse = {
      transcriptSummary: "テスト要約",
      glossary: [{ term: "API", explain: "接続口" }],
      difficulty: "easy",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: ["学び1"],
    };

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(llmResponse) }],
    });

    const result = await claudePlugin.summarize(
      { videoTitle: "テスト動画", transcript: "転写テキスト" },
      {}
    );

    expect(result.transcriptSummary).toBe("テスト要約");
    expect(result.difficulty).toBe("easy");
    expect(result.glossary).toEqual([{ term: "API", explain: "接続口" }]);
  });

  it("handles markdown code blocks", async () => {
    const json = JSON.stringify({
      transcriptSummary: "要約",
      glossary: [],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "```json\n" + json + "\n```" }],
    });

    const result = await claudePlugin.summarize(
      { videoTitle: "タイトル", transcript: "テキスト" },
      {}
    );
    expect(result.transcriptSummary).toBe("要約");
  });

  it("passes config apiKey to Anthropic constructor", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: [],
            difficulty: "normal",
            deprecatedFlags: [],
            prerequisites: "不要",
            learnings: [],
          }),
        },
      ],
    });

    await claudePlugin.summarize(
      { videoTitle: "タイトル", transcript: "テキスト" },
      { apiKey: "sk-custom-key" }
    );

    expect(mockCreate).toHaveBeenCalled();
  });

  it("falls back to env var when no apiKey in config", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: [],
            difficulty: "normal",
            deprecatedFlags: [],
            prerequisites: "不要",
            learnings: [],
          }),
        },
      ],
    });

    await claudePlugin.summarize(
      { videoTitle: "タイトル", transcript: "テキスト" },
      {}
    );

    expect(mockCreate).toHaveBeenCalled();
  });

  it("uses config model if provided", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: [],
            difficulty: "normal",
            deprecatedFlags: [],
            prerequisites: "不要",
            learnings: [],
          }),
        },
      ],
    });

    await claudePlugin.summarize(
      { videoTitle: "タイトル", transcript: "テキスト" },
      { model: "claude-opus-4-20250514" }
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-20250514" })
    );
  });

  it("throws on API error", async () => {
    mockCreate.mockRejectedValue(new Error("API error"));

    await expect(
      claudePlugin.summarize(
        { videoTitle: "タイトル", transcript: "テキスト" },
        {}
      )
    ).rejects.toThrow("API error");
  });

  it("throws when response has no text block", async () => {
    mockCreate.mockResolvedValue({ content: [] });

    await expect(
      claudePlugin.summarize(
        { videoTitle: "タイトル", transcript: "テキスト" },
        {}
      )
    ).rejects.toThrow("No text content in Claude response");
  });

  it("validates and defaults invalid fields", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: "not array",
            difficulty: "invalid",
            deprecatedFlags: null,
            prerequisites: "",
            learnings: 42,
          }),
        },
      ],
    });

    const result = await claudePlugin.summarize(
      { videoTitle: "タイトル", transcript: "テキスト" },
      {}
    );

    expect(result.glossary).toEqual([]);
    expect(result.difficulty).toBe("normal");
    expect(result.deprecatedFlags).toEqual([]);
    expect(result.prerequisites).toBe("不要");
    expect(result.learnings).toEqual([]);
  });
});
