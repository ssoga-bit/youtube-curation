import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";
import { GET } from "./route";

describe("GET /api/videos", () => {
  const makeVideo = (overrides = {}) => ({
    id: "v1",
    url: "https://youtube.com/watch?v=abc",
    title: "Test Video",
    channel: "Test Channel",
    language: "ja",
    durationMin: 10,
    publishedAt: new Date("2024-01-01"),
    tags: '["python"]',
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
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);
  });

  it("returns videos with pagination", async () => {
    const video = makeVideo();
    prismaMock.video.findMany.mockResolvedValue([video]);
    prismaMock.video.count.mockResolvedValue(1);

    const req = createRequest("http://localhost:3010/api/videos");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.videos).toHaveLength(1);
    expect(body.videos[0].tags).toEqual(["python"]);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it("filters by beginner level", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/videos?level=beginner");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([expect.objectContaining({ difficulty: "easy" })])
    );
  });

  it("filters by intermediate level", async () => {
    const req = createRequest("http://localhost:3010/api/videos?level=intermediate");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ difficulty: { in: ["normal", "hard"] } }),
      ])
    );
  });

  it("filters by short duration", async () => {
    const req = createRequest("http://localhost:3010/api/videos?duration=short");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ durationMin: { lte: 10 } }),
      ])
    );
  });

  it("filters by multiple durations", async () => {
    const req = createRequest("http://localhost:3010/api/videos?duration=short,long");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [{ durationMin: { lte: 10 } }, { durationMin: { gt: 30 } }],
        }),
      ])
    );
  });

  it("filters by language", async () => {
    const req = createRequest("http://localhost:3010/api/videos?language=ja");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([expect.objectContaining({ language: "ja" })])
    );
  });

  it("filters by tags (match all)", async () => {
    const req = createRequest("http://localhost:3010/api/videos?tags=python,ai");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([
        { tags: { contains: "python" } },
        { tags: { contains: "ai" } },
      ])
    );
  });

  it("searches by title or channel", async () => {
    const req = createRequest("http://localhost:3010/api/videos?q=python");
    await GET(req);

    const whereArg = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(whereArg.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [
            { title: { contains: "python" } },
            { channel: { contains: "python" } },
          ],
        }),
      ])
    );
  });

  it("sorts by bci (default)", async () => {
    const req = createRequest("http://localhost:3010/api/videos");
    await GET(req);

    const orderBy = prismaMock.video.findMany.mock.calls[0][0]?.orderBy;
    expect(orderBy).toEqual({ beginnerComfortIndex: "desc" });
  });

  it("sorts by newest", async () => {
    const req = createRequest("http://localhost:3010/api/videos?sort=newest");
    await GET(req);

    const orderBy = prismaMock.video.findMany.mock.calls[0][0]?.orderBy;
    expect(orderBy).toEqual({ publishedAt: "desc" });
  });

  it("sorts by popular", async () => {
    const req = createRequest("http://localhost:3010/api/videos?sort=popular");
    await GET(req);

    const orderBy = prismaMock.video.findMany.mock.calls[0][0]?.orderBy;
    expect(orderBy).toEqual({ likeRatio: "desc" });
  });

  it("sorts by recommended", async () => {
    const req = createRequest("http://localhost:3010/api/videos?sort=recommended");
    await GET(req);

    const orderBy = prismaMock.video.findMany.mock.calls[0][0]?.orderBy;
    expect(orderBy).toEqual({ qualityScore: "desc" });
  });

  it("handles pagination with page and limit", async () => {
    const req = createRequest("http://localhost:3010/api/videos?page=3&limit=5");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.skip).toBe(10); // (3-1)*5
    expect(call?.take).toBe(5);
  });

  it("clamps page to minimum 1", async () => {
    const req = createRequest("http://localhost:3010/api/videos?page=-5");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.skip).toBe(0);
  });

  it("clamps limit to max 100", async () => {
    const req = createRequest("http://localhost:3010/api/videos?limit=999");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.take).toBe(100);
  });

  it("returns totalPages in pagination", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(50);

    const req = createRequest("http://localhost:3010/api/videos?limit=20");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.pagination.totalPages).toBe(3);
  });
});
