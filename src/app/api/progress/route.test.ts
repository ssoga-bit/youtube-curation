import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET, POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

describe("GET /api/progress", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.userProgress.findMany.mockReset();
    prismaMock.userProgress.count.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockSession.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/progress");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when session has no user id", async () => {
    mockSession.mockResolvedValue({ user: { email: "a@b.com" } });

    const req = createRequest("http://localhost:3010/api/progress");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns user progress with pagination", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.userProgress.findMany.mockResolvedValue([
      {
        id: "p1",
        userId: "user1",
        videoId: "v1",
        watched: true,
        bookmarked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        video: { id: "v1", title: "Test" },
      },
    ]);
    prismaMock.userProgress.count.mockResolvedValue(1);

    const req = createRequest("http://localhost:3010/api/progress");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].watched).toBe(true);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("respects page and limit query params", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.userProgress.findMany.mockResolvedValue([]);
    prismaMock.userProgress.count.mockResolvedValue(30);

    const req = createRequest("http://localhost:3010/api/progress?page=2&limit=10");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 30,
      totalPages: 3,
    });

    const call = prismaMock.userProgress.findMany.mock.calls[0][0];
    expect(call?.skip).toBe(10);
    expect(call?.take).toBe(10);
  });
});

describe("POST /api/progress", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findUnique.mockReset();
    prismaMock.userProgress.upsert.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockSession.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { videoId: "v1", watched: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when videoId is missing", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { watched: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when video does not exist", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { videoId: "nonexistent", watched: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("upserts progress with watched flag", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
    prismaMock.userProgress.upsert.mockResolvedValue({
      id: "p1",
      userId: "user1",
      videoId: "v1",
      watched: true,
      bookmarked: false,
    });

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { videoId: "v1", watched: true },
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.progress.watched).toBe(true);
  });

  it("upserts progress with bookmarked flag", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
    prismaMock.userProgress.upsert.mockResolvedValue({
      id: "p1",
      userId: "user1",
      videoId: "v1",
      watched: false,
      bookmarked: true,
    });

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { videoId: "v1", bookmarked: true },
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(body.progress.bookmarked).toBe(true);
  });

  it("uses upsert with userId_videoId compound key", async () => {
    mockSession.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
    });
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
    prismaMock.userProgress.upsert.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/progress", {
      method: "POST",
      body: { videoId: "v1", watched: true },
    });
    await POST(req);

    expect(prismaMock.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_videoId: { userId: "user1", videoId: "v1" } },
      })
    );
  });
});
