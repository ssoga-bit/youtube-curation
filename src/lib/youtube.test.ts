import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractVideoId,
  parseISO8601Duration,
  hasChapterTimestamps,
  fetchVideoMeta,
  fetchTranscript,
} from "./youtube";

vi.mock("@danielxceron/youtube-transcript", () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn(),
  },
}));

import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
const mockFetchTranscript = YoutubeTranscript.fetchTranscript as ReturnType<typeof vi.fn>;

describe("extractVideoId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from watch URL without www", () => {
    expect(extractVideoId("https://youtube.com/watch?v=abc123")).toBe(
      "abc123"
    );
  });

  it("extracts ID from short youtu.be URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from embed URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL without www", () => {
    expect(extractVideoId("https://youtube.com/embed/abc123")).toBe("abc123");
  });

  it("handles extra query params in watch URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=abc123&t=120")
    ).toBe("abc123");
  });

  it("returns null for invalid URL", () => {
    expect(extractVideoId("not-a-url")).toBeNull();
  });

  it("returns null for non-YouTube URL", () => {
    expect(extractVideoId("https://vimeo.com/12345")).toBeNull();
  });

  it("returns null for YouTube URL without video ID", () => {
    expect(extractVideoId("https://www.youtube.com/watch")).toBeNull();
  });

  it("returns null for empty youtu.be path", () => {
    expect(extractVideoId("https://youtu.be/")).toBeNull();
  });

  it("returns null for empty embed path", () => {
    expect(extractVideoId("https://www.youtube.com/embed/")).toBeNull();
  });
});

describe("parseISO8601Duration", () => {
  it("parses hours, minutes, seconds", () => {
    expect(parseISO8601Duration("PT1H2M3S")).toBe(62); // 60+2+3/60 ≈ 62
  });

  it("parses minutes only", () => {
    expect(parseISO8601Duration("PT10M")).toBe(10);
  });

  it("parses seconds only", () => {
    expect(parseISO8601Duration("PT30S")).toBe(1); // rounds 0.5 to 1
  });

  it("parses hours only", () => {
    expect(parseISO8601Duration("PT2H")).toBe(120);
  });

  it("returns 0 for PT0S", () => {
    expect(parseISO8601Duration("PT0S")).toBe(0);
  });

  it("returns 0 for invalid format", () => {
    expect(parseISO8601Duration("invalid")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseISO8601Duration("")).toBe(0);
  });

  it("handles hours and minutes without seconds", () => {
    expect(parseISO8601Duration("PT1H30M")).toBe(90);
  });

  it("handles minutes and seconds without hours", () => {
    expect(parseISO8601Duration("PT5M30S")).toBe(6); // 5 + 30/60 = 5.5, rounds to 6
  });
});

describe("hasChapterTimestamps", () => {
  it("detects simple timestamps like 0:00", () => {
    expect(hasChapterTimestamps("0:00 Introduction\n1:30 Part 1")).toBe(true);
  });

  it("detects timestamps with double-digit minutes", () => {
    expect(hasChapterTimestamps("00:00 Start\n10:30 Middle")).toBe(true);
  });

  it("detects timestamps with hours", () => {
    expect(hasChapterTimestamps("1:00:00 Introduction")).toBe(true);
  });

  it("returns false for text without timestamps", () => {
    expect(hasChapterTimestamps("Just a regular description")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasChapterTimestamps("")).toBe(false);
  });

  it("detects timestamp at beginning of any line", () => {
    expect(
      hasChapterTimestamps("Some intro text\n5:30 Chapter starts here")
    ).toBe(true);
  });
});

describe("fetchTranscript", () => {
  beforeEach(() => {
    mockFetchTranscript.mockReset();
  });

  it("returns joined text on success", async () => {
    mockFetchTranscript.mockResolvedValue([
      { text: "Hello", offset: 0, duration: 1000 },
      { text: "World", offset: 1000, duration: 1000 },
    ]);
    const result = await fetchTranscript("abc123");
    expect(result).toBe("Hello World");
    expect(mockFetchTranscript).toHaveBeenCalledWith("abc123", { lang: "ja" });
  });

  it("returns null when all languages return empty segments", async () => {
    mockFetchTranscript.mockResolvedValue([]);
    const result = await fetchTranscript("abc123");
    expect(result).toBeNull();
    // Should have tried ja, en, and undefined
    expect(mockFetchTranscript).toHaveBeenCalledTimes(3);
  });

  it("returns null when all languages throw errors", async () => {
    mockFetchTranscript.mockRejectedValue(new Error("No transcript"));
    const result = await fetchTranscript("abc123");
    expect(result).toBeNull();
    expect(mockFetchTranscript).toHaveBeenCalledTimes(3);
  });
});

describe("fetchVideoMeta", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns null when YOUTUBE_API_KEY is not set", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const result = await fetchVideoMeta("test-id");
    expect(result).toBeNull();
  });

  it("returns metadata on success", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: {
                title: "Test Video",
                channelTitle: "Test Channel",
                description: "0:00 Intro\n1:30 Part 1",
                publishedAt: "2024-01-01T00:00:00Z",
                defaultLanguage: "ja",
                tags: ["python", "tutorial"],
              },
              contentDetails: { duration: "PT10M30S" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: "caption-1" }],
        }),
      });

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchVideoMeta("test-id");
    expect(result).toEqual({
      title: "Test Video",
      channel: "Test Channel",
      durationMin: 11, // 10 + 30/60 ≈ 10.5, rounds to 11
      publishedAt: "2024-01-01T00:00:00Z",
      language: "ja",
      hasCc: true,
      hasChapters: true,
      tags: ["python", "tutorial"],
    });
  });

  it("returns null when video not found", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      })
    );

    const result = await fetchVideoMeta("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when API returns error", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      })
    );

    const result = await fetchVideoMeta("test-id");
    expect(result).toBeNull();
  });

  it("defaults language to ja when not specified", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: {
                title: "Video",
                channelTitle: "Channel",
                description: "",
                publishedAt: "2024-01-01T00:00:00Z",
              },
              contentDetails: { duration: "PT5M" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchVideoMeta("test-id");
    expect(result?.language).toBe("ja");
  });

  it("uses defaultAudioLanguage as fallback", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: {
                title: "Video",
                channelTitle: "Channel",
                description: "",
                publishedAt: "2024-01-01T00:00:00Z",
                defaultAudioLanguage: "en",
              },
              contentDetails: { duration: "PT5M" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchVideoMeta("test-id");
    expect(result?.language).toBe("en");
  });

  it("returns hasCc false when captions API fails", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              snippet: {
                title: "Video",
                channelTitle: "Channel",
                description: "",
                publishedAt: "2024-01-01T00:00:00Z",
              },
              contentDetails: { duration: "PT5M" },
            },
          ],
        }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchVideoMeta("test-id");
    expect(result?.hasCc).toBe(false);
  });
});
