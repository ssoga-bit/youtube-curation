import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("GET /api/admin/videos", () => {
  const makeVideo = (overrides = {}) => ({
    id: "v1",
    title: "Test",
    channel: "Ch",
    tags: '["python"]',
    glossary: null,
    deprecatedFlags: null,
    isPublished: true,
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findMany.mockReset();
    prismaMock.video.count.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/videos");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/admin/videos");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns videos with pagination for admin", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([makeVideo()]);
    prismaMock.video.count.mockResolvedValue(1);

    const req = createRequest("http://localhost:3010/api/admin/videos");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.videos).toHaveLength(1);
    expect(body.videos[0].tags).toEqual(["python"]);
    expect(body.pagination.total).toBe(1);
  });

  it("searches by title or channel", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/admin/videos?q=python");
    await GET(req);

    const where = prismaMock.video.findMany.mock.calls[0][0]?.where;
    expect(where?.OR).toEqual([
      { title: { contains: "python" } },
      { channel: { contains: "python" } },
    ]);
  });

  it("uses default limit of 50", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/admin/videos");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.take).toBe(50);
  });

  it("handles pagination with page param", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(100);

    const req = createRequest("http://localhost:3010/api/admin/videos?page=2&limit=10");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.skip).toBe(10);
    expect(call?.take).toBe(10);
  });

  it("orders by updatedAt desc", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/admin/videos");
    await GET(req);

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.orderBy).toEqual({ updatedAt: "desc" });
  });
});
