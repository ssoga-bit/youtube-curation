import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { parseJson, createRequest } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };
const userSession = { user: { id: "u1", role: "user" } };

const baseUrl = "http://localhost:3010/api/admin/users";

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.user.findMany.mockReset();
    prismaMock.user.count.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue(userSession);
    const res = await GET(createRequest(baseUrl));
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET(createRequest(baseUrl));
    expect(res.status).toBe(403);
  });

  it("returns empty array when no users", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = await GET(createRequest(baseUrl));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.users).toEqual([]);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("returns users with watched videos", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "u1",
        name: "テストユーザー",
        email: "test@example.com",
        role: "user",
        createdAt: new Date("2025-01-01"),
        progress: [
          {
            watched: true,
            updatedAt: new Date("2025-06-01"),
            video: {
              id: "v1",
              title: "React入門",
              channel: "Tech Channel",
              durationMin: 30,
              difficulty: "easy",
            },
          },
          {
            watched: true,
            updatedAt: new Date("2025-06-02"),
            video: {
              id: "v2",
              title: "Next.js実践",
              channel: "Dev Channel",
              durationMin: 45,
              difficulty: "normal",
            },
          },
        ],
        _count: { progress: 2 },
      },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const res = await GET(createRequest(baseUrl));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);

    const user = body.users[0];
    expect(user.id).toBe("u1");
    expect(user.name).toBe("テストユーザー");
    expect(user.email).toBe("test@example.com");
    expect(user.watchedCount).toBe(2);
    expect(user.totalWatchMin).toBe(75);
    expect(user.watchedVideos).toHaveLength(2);
    expect(user.watchedVideos[0].videoId).toBe("v1");
    expect(user.watchedVideos[0].title).toBe("React入門");

    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("returns user with no watched videos", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "u2",
        name: null,
        email: "new@example.com",
        role: "user",
        createdAt: new Date("2025-03-01"),
        progress: [],
        _count: { progress: 0 },
      },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const res = await GET(createRequest(baseUrl));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    const user = body.users[0];
    expect(user.watchedCount).toBe(0);
    expect(user.totalWatchMin).toBe(0);
    expect(user.watchedVideos).toEqual([]);
  });

  it("respects page and limit query parameters", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(50);

    const res = await GET(createRequest(`${baseUrl}?page=3&limit=10`));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 50,
      totalPages: 5,
    });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
  });

  it("clamps limit to MAX_LIMIT", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = await GET(createRequest(`${baseUrl}?limit=500`));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.pagination.limit).toBe(100);
  });

  it("handles DB error gracefully", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET(createRequest(baseUrl));
    const body = await parseJson<any>(res);

    expect(res.status).toBe(500);
    expect(body.error).toBeTruthy();
  });
});
