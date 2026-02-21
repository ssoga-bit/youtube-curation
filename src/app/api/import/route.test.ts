import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock dependencies
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

vi.mock("@/lib/youtube", () => ({
  extractVideoId: vi.fn().mockReturnValue("abc123"),
  fetchVideoMeta: vi.fn().mockResolvedValue(null),
}));

import { getServerSession } from "next-auth";
import { POST } from "./route";
import { fetchVideoMeta } from "@/lib/youtube";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockFetchMeta = fetchVideoMeta as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("POST /api/import", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockReset();
    prismaMock.video.create.mockReset();
    prismaMock.video.update.mockReset();
    mockFetchMeta.mockReset();
    mockFetchMeta.mockResolvedValue(null);
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 for non-array body", async () => {
    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: { notAnArray: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts array body", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Test",
          durationMin: 10,
        },
      ],
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.created).toBe(1);
  });

  it("accepts { videos: [...] } body", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: {
        videos: [
          {
            url: "https://youtube.com/watch?v=abc",
            title: "Test",
            durationMin: 10,
          },
        ],
      },
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.created).toBe(1);
  });

  it("deduplicates by URL within batch", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "First",
          durationMin: 10,
        },
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Duplicate",
          durationMin: 10,
        },
      ],
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.created).toBe(1);
    expect(body.total).toBe(1);
  });

  it("updates existing video by URL", async () => {
    prismaMock.video.findUnique.mockResolvedValue({
      id: "existing",
      url: "https://youtube.com/watch?v=abc",
    });
    prismaMock.video.update.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Updated",
          durationMin: 15,
        },
      ],
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.updated).toBe(1);
    expect(body.created).toBe(0);
  });

  it("skips videos without title and durationMin after YouTube lookup", async () => {
    mockFetchMeta.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [{ url: "https://youtube.com/watch?v=abc" }],
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.skipped).toBe(1);
    expect(body.created).toBe(0);
  });

  it("auto-fills metadata from YouTube API", async () => {
    mockFetchMeta.mockResolvedValue({
      title: "YT Title",
      channel: "YT Channel",
      durationMin: 12,
      publishedAt: "2024-01-01T00:00:00Z",
      language: "en",
      hasCc: true,
      hasChapters: true,
      tags: ["tag1"],
    });
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [{ url: "https://youtube.com/watch?v=abc" }],
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.created).toBe(1);
    expect(prismaMock.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "YT Title",
          channel: "YT Channel",
        }),
      })
    );
  });

  it("maps rating 1-2 to hard difficulty", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Test",
          durationMin: 10,
          rating: 2,
        },
      ],
    });
    await POST(req);

    expect(prismaMock.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ difficulty: "hard" }),
      })
    );
  });

  it("maps rating 3 to normal difficulty", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Test",
          durationMin: 10,
          rating: 3,
        },
      ],
    });
    await POST(req);

    expect(prismaMock.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ difficulty: "normal" }),
      })
    );
  });

  it("maps rating 4-5 to easy difficulty", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Test",
          durationMin: 10,
          rating: 5,
        },
      ],
    });
    await POST(req);

    expect(prismaMock.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ difficulty: "easy" }),
      })
    );
  });

  it("converts rating to qualityScore (1-5 → 0-1)", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    prismaMock.video.create.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/import", {
      method: "POST",
      body: [
        {
          url: "https://youtube.com/watch?v=abc",
          title: "Test",
          durationMin: 10,
          rating: 5,
        },
      ],
    });
    await POST(req);

    // (5-1)/4 = 1.0
    expect(prismaMock.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ qualityScore: 1 }),
      })
    );
  });
});
