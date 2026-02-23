import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";

vi.mock("@/lib/youtube", () => ({
  extractVideoId: vi.fn(),
  fetchTranscript: vi.fn(),
}));

vi.mock("@/lib/llm", () => ({
  generateVideoSummary: vi.fn(),
}));

vi.mock("@/lib/bci-weights", () => ({
  getBCIWeights: vi.fn().mockResolvedValue({
    shortDuration: 20,
    hasCc: 15,
    hasChapters: 15,
    easyDifficulty: 20,
    recentPublish: 10,
    hasSampleCode: 10,
    healthyLikeRatio: 10,
  }),
}));

vi.mock("@/lib/bci", () => ({
  calculateBCI: vi.fn().mockReturnValue(75),
}));

import { extractVideoId, fetchTranscript } from "@/lib/youtube";
import { generateVideoSummary } from "@/lib/llm";
import { autoSummarize } from "./auto-summarize";

const mockExtractVideoId = extractVideoId as ReturnType<typeof vi.fn>;
const mockFetchTranscript = fetchTranscript as ReturnType<typeof vi.fn>;
const mockGenerateSummary = generateVideoSummary as ReturnType<typeof vi.fn>;

const mockVideo = {
  id: "video1",
  url: "https://youtube.com/watch?v=abc123",
  title: "Test Video",
  durationMin: 10,
  hasCc: true,
  hasChapters: false,
  difficulty: "easy",
  publishedAt: new Date("2024-01-01"),
  hasSampleCode: false,
  likeRatio: 0,
};

describe("autoSummarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches transcript, generates summary, and updates DB", async () => {
    mockExtractVideoId.mockReturnValue("abc123");
    mockFetchTranscript.mockResolvedValue("transcript text");
    mockGenerateSummary.mockResolvedValue({
      transcriptSummary: "A summary",
      glossary: [{ term: "API", explain: "Application Programming Interface" }],
      difficulty: "normal",
      deprecatedFlags: [],
      prerequisites: "Basic JS",
      learnings: ["REST API basics"],
    });
    prismaMock.video.findUnique.mockResolvedValue(mockVideo);
    prismaMock.video.update.mockResolvedValue({});

    await autoSummarize("video1", "https://youtube.com/watch?v=abc123", "Test Video");

    expect(mockExtractVideoId).toHaveBeenCalledWith("https://youtube.com/watch?v=abc123");
    expect(mockFetchTranscript).toHaveBeenCalledWith("abc123");
    expect(mockGenerateSummary).toHaveBeenCalledWith("Test Video", "transcript text");
    expect(prismaMock.video.update).toHaveBeenCalledWith({
      where: { id: "video1" },
      data: {
        transcriptSummary: "A summary",
        glossary: JSON.stringify([{ term: "API", explain: "Application Programming Interface" }]),
        difficulty: "normal",
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "Basic JS",
        learnings: JSON.stringify(["REST API basics"]),
        beginnerComfortIndex: 75,
      },
    });
  });

  it("does nothing when YouTube ID extraction fails", async () => {
    mockExtractVideoId.mockReturnValue(null);

    await autoSummarize("video1", "invalid-url", "Test");

    expect(mockFetchTranscript).not.toHaveBeenCalled();
    expect(prismaMock.video.update).not.toHaveBeenCalled();
  });

  it("does nothing when transcript is null", async () => {
    mockExtractVideoId.mockReturnValue("abc123");
    mockFetchTranscript.mockResolvedValue(null);

    await autoSummarize("video1", "https://youtube.com/watch?v=abc123", "Test");

    expect(mockGenerateSummary).not.toHaveBeenCalled();
    expect(prismaMock.video.update).not.toHaveBeenCalled();
  });

  it("does not throw when generateVideoSummary fails", async () => {
    mockExtractVideoId.mockReturnValue("abc123");
    mockFetchTranscript.mockResolvedValue("transcript text");
    mockGenerateSummary.mockRejectedValue(new Error("LLM error"));

    await expect(
      autoSummarize("video1", "https://youtube.com/watch?v=abc123", "Test")
    ).resolves.toBeUndefined();

    expect(prismaMock.video.update).not.toHaveBeenCalled();
  });
});
