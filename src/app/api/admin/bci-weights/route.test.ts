import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";
import { DEFAULT_BCI_WEIGHTS } from "@/lib/bci";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET, PUT } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };
const userSession = { user: { id: "user1", role: "user" } };

describe("GET /api/admin/bci-weights", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.appSetting.findUnique.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue(userSession);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns default weights when no DB setting", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body).toEqual(DEFAULT_BCI_WEIGHTS);
  });

  it("returns saved weights from DB", async () => {
    mockSession.mockResolvedValue(adminSession);
    const custom = { shortDuration: 25, hasCc: 10 };
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "bci-weights",
      value: JSON.stringify(custom),
    });

    const res = await GET();
    const body = await parseJson<any>(res);

    expect(body.shortDuration).toBe(25);
    expect(body.hasCc).toBe(10);
    expect(body.hasChapters).toBe(DEFAULT_BCI_WEIGHTS.hasChapters);
  });
});

describe("PUT /api/admin/bci-weights", () => {
  const validWeights = {
    shortDuration: 20,
    hasCc: 15,
    hasChapters: 15,
    easyDifficulty: 20,
    recentPublish: 10,
    hasSampleCode: 10,
    healthyLikeRatio: 10,
  };

  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.appSetting.upsert.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue(userSession);
    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: validWeights,
    });
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("saves valid weights", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: validWeights,
    });
    const res = await PUT(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body).toEqual(validWeights);
  });

  it("returns 400 when a weight key is missing", async () => {
    mockSession.mockResolvedValue(adminSession);

    const incomplete = { ...validWeights };
    delete (incomplete as any).hasCc;

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: incomplete,
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await parseJson<any>(res);
    expect(body.error).toContain("Missing weight key: hasCc");
  });

  it("returns 400 when value exceeds 30", async () => {
    mockSession.mockResolvedValue(adminSession);

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: { ...validWeights, shortDuration: 50 },
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await parseJson<any>(res);
    expect(body.error).toContain("shortDuration");
  });

  it("returns 400 when value is negative", async () => {
    mockSession.mockResolvedValue(adminSession);

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: { ...validWeights, hasCc: -1 },
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when value is not a number", async () => {
    mockSession.mockResolvedValue(adminSession);

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: { ...validWeights, hasCc: "not-a-number" },
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
  });

  it("accepts 0 as valid weight value", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: { ...validWeights, shortDuration: 0 },
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
  });

  it("accepts 30 as valid weight value", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/admin/bci-weights", {
      method: "PUT",
      body: { ...validWeights, shortDuration: 30 },
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
  });
});
