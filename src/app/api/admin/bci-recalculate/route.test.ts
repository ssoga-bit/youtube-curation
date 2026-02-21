import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
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

import { getServerSession } from "next-auth";
import { POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("POST /api/admin/bci-recalculate", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findMany.mockReset();
    prismaMock.video.update.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("recalculates BCI for all videos", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([
      {
        id: "v1",
        durationMin: 10,
        hasCc: true,
        hasChapters: true,
        difficulty: "easy",
        publishedAt: new Date(),
        hasSampleCode: true,
        likeRatio: 0.95,
        beginnerComfortIndex: 50, // outdated value, should be recalculated
      },
    ]);
    prismaMock.video.update.mockResolvedValue({});

    const res = await POST();
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.updated).toBe(1);
  });

  it("skips videos where BCI has not changed", async () => {
    mockSession.mockResolvedValue(adminSession);
    // Create a video that matches the expected BCI calculation exactly
    prismaMock.video.findMany.mockResolvedValue([
      {
        id: "v1",
        durationMin: 10,
        hasCc: true,
        hasChapters: true,
        difficulty: "easy",
        publishedAt: new Date(),
        hasSampleCode: true,
        likeRatio: 0.95,
        beginnerComfortIndex: 100, // already correct
      },
    ]);

    const res = await POST();
    const body = await parseJson<any>(res);

    expect(body.updated).toBe(0);
    expect(body.total).toBe(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns counts for multiple videos", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findMany.mockResolvedValue([
      {
        id: "v1",
        durationMin: 10,
        hasCc: true,
        hasChapters: true,
        difficulty: "easy",
        publishedAt: new Date(),
        hasSampleCode: true,
        likeRatio: 0.95,
        beginnerComfortIndex: 100, // correct - skip
      },
      {
        id: "v2",
        durationMin: 60,
        hasCc: false,
        hasChapters: false,
        difficulty: "hard",
        publishedAt: new Date("2020-01-01"),
        hasSampleCode: false,
        likeRatio: 0.3,
        beginnerComfortIndex: 99, // wrong - update
      },
    ]);
    prismaMock.video.update.mockResolvedValue({});

    const res = await POST();
    const body = await parseJson<any>(res);

    expect(body.total).toBe(2);
    expect(body.updated).toBe(1);
  });
});
