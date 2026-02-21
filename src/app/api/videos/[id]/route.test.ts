import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";
import { GET } from "./route";

describe("GET /api/videos/[id]", () => {
  const makeVideo = (overrides = {}) => ({
    id: "v1",
    url: "https://youtube.com/watch?v=abc",
    title: "Test Video",
    channel: "Test Channel",
    language: "ja",
    durationMin: 10,
    publishedAt: new Date("2024-01-01"),
    tags: '["python","ai"]',
    hasCc: true,
    hasChapters: false,
    hasSampleCode: false,
    difficulty: "easy",
    likeRatio: 0.9,
    qualityScore: 0.8,
    beginnerComfortIndex: 75,
    transcriptSummary: null,
    glossary: null,
    deprecatedFlags: null,
    sourceNotes: null,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    prismaMock.video.findUnique.mockReset();
    prismaMock.video.findMany.mockReset();
  });

  it("returns video with parsed JSON fields", async () => {
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.findMany.mockResolvedValue([]);

    const req = createRequest("http://localhost:3010/api/videos/v1");
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.video.tags).toEqual(["python", "ai"]);
    expect(body.video.id).toBe("v1");
  });

  it("returns 404 for non-existent video", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/videos/nonexistent");
    const res = await GET(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for unpublished video", async () => {
    prismaMock.video.findUnique.mockResolvedValue(
      makeVideo({ isPublished: false })
    );

    const req = createRequest("http://localhost:3010/api/videos/v1");
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });

    expect(res.status).toBe(404);
  });

  it("returns related videos with overlapping tags", async () => {
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.findMany.mockResolvedValue([
      makeVideo({ id: "v2", title: "Related", tags: '["python"]' }),
    ]);

    const req = createRequest("http://localhost:3010/api/videos/v1");
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    const body = await parseJson<any>(res);

    expect(body.relatedVideos).toHaveLength(1);
    expect(body.relatedVideos[0].id).toBe("v2");
  });

  it("returns max 6 related videos", async () => {
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.findMany.mockResolvedValue([]);

    const req = createRequest("http://localhost:3010/api/videos/v1");
    await GET(req, { params: Promise.resolve({ id: "v1" }) });

    const findManyCall = prismaMock.video.findMany.mock.calls[0][0];
    expect(findManyCall?.take).toBe(6);
  });

  it("returns empty relatedVideos when video has no tags", async () => {
    prismaMock.video.findUnique.mockResolvedValue(makeVideo({ tags: "[]" }));

    const req = createRequest("http://localhost:3010/api/videos/v1");
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    const body = await parseJson<any>(res);

    expect(body.relatedVideos).toEqual([]);
    expect(prismaMock.video.findMany).not.toHaveBeenCalled();
  });
});
