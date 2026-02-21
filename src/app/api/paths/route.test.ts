import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";
import { GET } from "./route";

describe("GET /api/paths", () => {
  beforeEach(() => {
    prismaMock.path.findMany.mockReset();
    prismaMock.path.count.mockReset();
  });

  it("returns published paths with step count and pagination", async () => {
    prismaMock.path.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Python入門",
        targetAudience: "初心者",
        goal: "基礎を学ぶ",
        totalTimeEstimate: 45,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { steps: 3 },
      },
    ]);
    prismaMock.path.count.mockResolvedValue(1);

    const req = createRequest("http://localhost:3010/api/paths");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Python入門");
    expect(body.data[0].stepCount).toBe(3);
    expect(body.data[0]._count).toBeUndefined();
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("returns empty array when no published paths", async () => {
    prismaMock.path.findMany.mockResolvedValue([]);
    prismaMock.path.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/paths");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("only queries for published paths", async () => {
    prismaMock.path.findMany.mockResolvedValue([]);
    prismaMock.path.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/paths");
    await GET(req);

    const call = prismaMock.path.findMany.mock.calls[0][0];
    expect(call?.where).toEqual({ isPublished: true });
  });

  it("respects page and limit query params", async () => {
    prismaMock.path.findMany.mockResolvedValue([]);
    prismaMock.path.count.mockResolvedValue(50);

    const req = createRequest("http://localhost:3010/api/paths?page=3&limit=10");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 50,
      totalPages: 5,
    });

    const call = prismaMock.path.findMany.mock.calls[0][0];
    expect(call?.skip).toBe(20);
    expect(call?.take).toBe(10);
  });

  it("clamps page to minimum 1", async () => {
    prismaMock.path.findMany.mockResolvedValue([]);
    prismaMock.path.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/paths?page=-5");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.pagination.page).toBe(1);
  });

  it("clamps limit to MAX_LIMIT", async () => {
    prismaMock.path.findMany.mockResolvedValue([]);
    prismaMock.path.count.mockResolvedValue(0);

    const req = createRequest("http://localhost:3010/api/paths?limit=999");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(body.pagination.limit).toBe(100);
  });
});
