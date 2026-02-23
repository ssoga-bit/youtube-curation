import { describe, it, expect, vi, beforeEach } from "vitest";
import { difyPlugin } from "./dify";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("difyPlugin", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("has correct metadata", () => {
    expect(difyPlugin.key).toBe("dify");
    expect(difyPlugin.name).toBe("Dify Workflow");
  });

  it("throws when endpoint is missing", async () => {
    await expect(
      difyPlugin.summarize(
        { videoTitle: "タイトル", transcript: "テキスト" },
        { apiKey: "app-xxx" }
      )
    ).rejects.toThrow("Dify endpoint is required");
  });

  it("throws when apiKey is missing", async () => {
    await expect(
      difyPlugin.summarize(
        { videoTitle: "タイトル", transcript: "テキスト" },
        { endpoint: "https://api.dify.ai/v1" }
      )
    ).rejects.toThrow("Dify API key is required");
  });

  it("calls correct URL with Bearer token", async () => {
    const outputData = {
      transcriptSummary: "要約",
      glossary: [],
      difficulty: "easy",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: { outputs: outputData } }),
    });

    await difyPlugin.summarize(
      { videoTitle: "テスト", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.dify.ai/v1/workflows/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer app-xxx",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("strips trailing slash from endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            outputs: {
              transcriptSummary: "要約",
              glossary: [],
              difficulty: "normal",
              deprecatedFlags: [],
              prerequisites: "不要",
              learnings: [],
            },
          },
        }),
    });

    await difyPlugin.summarize(
      { videoTitle: "テスト", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1/", apiKey: "app-xxx" }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.dify.ai/v1/workflows/run",
      expect.anything()
    );
  });

  it("sends correct inputs in body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            outputs: {
              transcriptSummary: "要約",
              glossary: [],
              difficulty: "normal",
              deprecatedFlags: [],
              prerequisites: "不要",
              learnings: [],
            },
          },
        }),
    });

    await difyPlugin.summarize(
      { videoTitle: "動画タイトル", transcript: "転写テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.inputs.video_title).toBe("動画タイトル");
    expect(callBody.inputs.transcript).toBe("転写テキスト");
    expect(callBody.response_mode).toBe("blocking");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("server error"),
    });

    await expect(
      difyPlugin.summarize(
        { videoTitle: "タイトル", transcript: "テキスト" },
        { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
      )
    ).rejects.toThrow("Dify API error: 500");
  });

  it("parses direct object outputs (pattern 1)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            outputs: {
              transcriptSummary: "直接オブジェクト要約",
              glossary: [{ term: "API", explain: "接続口" }],
              difficulty: "hard",
              deprecatedFlags: [],
              prerequisites: "基礎知識",
              learnings: ["学び"],
            },
          },
        }),
    });

    const result = await difyPlugin.summarize(
      { videoTitle: "テスト", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    expect(result.transcriptSummary).toBe("直接オブジェクト要約");
    expect(result.difficulty).toBe("hard");
  });

  it("parses JSON string outputs (pattern 2)", async () => {
    const jsonString = JSON.stringify({
      transcriptSummary: "JSON文字列要約",
      glossary: [],
      difficulty: "easy",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(jsonString),
    });

    const result = await difyPlugin.summarize(
      { videoTitle: "テスト", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    expect(result.transcriptSummary).toBe("JSON文字列要約");
  });

  it("parses outputs.result JSON string (pattern 3)", async () => {
    const resultJson = JSON.stringify({
      transcriptSummary: "resultフィールド要約",
      glossary: [],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: ["学び1"],
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { outputs: { result: resultJson } },
        }),
    });

    const result = await difyPlugin.summarize(
      { videoTitle: "テスト", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    expect(result.transcriptSummary).toBe("resultフィールド要約");
    expect(result.learnings).toEqual(["学び1"]);
  });

  it("applies validation defaults to dify output", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { outputs: { result: JSON.stringify({}) } },
        }),
    });

    const result = await difyPlugin.summarize(
      { videoTitle: "フォールバック", transcript: "テキスト" },
      { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" }
    );

    expect(result.transcriptSummary).toBe("フォールバック");
    expect(result.difficulty).toBe("normal");
    expect(result.prerequisites).toBe("不要");
  });
});
