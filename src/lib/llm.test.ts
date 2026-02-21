import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so the variable is available when vi.mock factory runs (hoisted)
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

const { mockGetConfig, mockGetPlugin } = vi.hoisted(() => ({
  mockGetConfig: vi.fn(),
  mockGetPlugin: vi.fn(),
}));

// Mock settings and registry for plugin delegation tests
// These are lazy-applied: only active when mockGetConfig/mockGetPlugin have implementations
vi.mock("@/lib/plugins/settings", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/plugins/settings")>();
  return {
    ...orig,
    getSummarizerConfig: (...args: Parameters<typeof orig.getSummarizerConfig>) =>
      mockGetConfig.getMockImplementation()
        ? mockGetConfig(...args)
        : orig.getSummarizerConfig(...args),
  };
});

vi.mock("@/lib/plugins/registry", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/plugins/registry")>();
  return {
    ...orig,
    getPlugin: (...args: Parameters<typeof orig.getPlugin>) =>
      mockGetPlugin.getMockImplementation()
        ? mockGetPlugin(...args)
        : orig.getPlugin(...args),
  };
});

import { generateVideoSummary } from "./llm";

describe("generateVideoSummary", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockGetConfig.mockReset();
    mockGetPlugin.mockReset();

    // Default: use claude plugin so tests don't need a real DB connection
    mockGetConfig.mockImplementation(() =>
      Promise.resolve({
        activePlugin: "claude",
        pluginConfigs: {},
      })
    );
  });

  // --- Existing integration tests (via Claude plugin + mocked Anthropic SDK) ---

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

    const result = await generateVideoSummary("テスト動画", "転写テキスト");
    expect(result.transcriptSummary).toBe("テスト要約");
    expect(result.difficulty).toBe("easy");
    expect(result.glossary).toEqual([{ term: "API", explain: "接続口" }]);
    expect(result.learnings).toEqual(["学び1"]);
  });

  it("handles markdown code blocks in response", async () => {
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

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("要約");
  });

  it("defaults invalid difficulty to normal", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: [],
            difficulty: "super-hard",
            deprecatedFlags: [],
            prerequisites: "不要",
            learnings: [],
          }),
        },
      ],
    });

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.difficulty).toBe("normal");
  });

  it("returns fallback on API error", async () => {
    mockCreate.mockRejectedValue(new Error("API error"));

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("タイトル");
    expect(result.difficulty).toBe("normal");
    expect(result.glossary).toEqual([]);
    expect(result.deprecatedFlags).toEqual([]);
    expect(result.prerequisites).toBe("不要");
    expect(result.learnings).toEqual([]);
  });

  it("returns fallback when response has no text block", async () => {
    mockCreate.mockResolvedValue({ content: [] });

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("タイトル");
  });

  it("defaults missing fields in parsed response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({}) }],
    });

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("タイトル");
    expect(result.glossary).toEqual([]);
    expect(result.difficulty).toBe("normal");
    expect(result.prerequisites).toBe("不要");
    expect(result.learnings).toEqual([]);
  });

  it("handles non-array glossary gracefully", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            transcriptSummary: "要約",
            glossary: "not an array",
            difficulty: "easy",
            deprecatedFlags: "also not array",
            prerequisites: "基礎知識",
            learnings: "not array",
          }),
        },
      ],
    });

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.glossary).toEqual([]);
    expect(result.deprecatedFlags).toEqual([]);
    expect(result.learnings).toEqual([]);
  });

  // --- Plugin delegation tests ---

  it("delegates to the active plugin from config", async () => {
    const mockSummarize = vi.fn().mockResolvedValue({
      transcriptSummary: "プラグイン要約",
      glossary: [],
      difficulty: "easy",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });

    mockGetConfig.mockImplementation(() =>
      Promise.resolve({
        activePlugin: "test-plugin",
        pluginConfigs: { "test-plugin": { key1: "val1" } },
      })
    );

    mockGetPlugin.mockImplementation(() => ({
      name: "Test Plugin",
      key: "test-plugin",
      configSchema: [],
      summarize: mockSummarize,
    }));

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("プラグイン要約");
    expect(mockSummarize).toHaveBeenCalledWith(
      { videoTitle: "タイトル", transcript: "テキスト" },
      { key1: "val1" }
    );
  });

  it("returns fallback when plugin is unknown", async () => {
    mockGetConfig.mockImplementation(() =>
      Promise.resolve({
        activePlugin: "nonexistent",
        pluginConfigs: {},
      })
    );

    mockGetPlugin.mockImplementation(() => undefined);

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("タイトル");
    expect(result.difficulty).toBe("normal");
  });

  it("returns fallback when plugin throws", async () => {
    mockGetConfig.mockImplementation(() =>
      Promise.resolve({
        activePlugin: "failing",
        pluginConfigs: {},
      })
    );

    mockGetPlugin.mockImplementation(() => ({
      name: "Failing Plugin",
      key: "failing",
      configSchema: [],
      summarize: vi.fn().mockRejectedValue(new Error("Plugin crashed")),
    }));

    const result = await generateVideoSummary("タイトル", "テキスト");
    expect(result.transcriptSummary).toBe("タイトル");
    expect(result.difficulty).toBe("normal");
  });

  it("passes empty config when plugin has no stored config", async () => {
    const mockSummarize = vi.fn().mockResolvedValue({
      transcriptSummary: "要約",
      glossary: [],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });

    mockGetConfig.mockImplementation(() =>
      Promise.resolve({
        activePlugin: "test",
        pluginConfigs: {},
      })
    );

    mockGetPlugin.mockImplementation(() => ({
      name: "Test",
      key: "test",
      configSchema: [],
      summarize: mockSummarize,
    }));

    await generateVideoSummary("タイトル", "テキスト");
    expect(mockSummarize).toHaveBeenCalledWith(
      expect.anything(),
      {}
    );
  });
});
