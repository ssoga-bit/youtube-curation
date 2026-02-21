import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

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
import { PATCH, DELETE } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

const makeVideo = (overrides = {}) => ({
  id: "v1",
  url: "https://youtube.com/watch?v=abc",
  title: "Test",
  channel: "Ch",
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

describe("PATCH /api/admin/videos/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findUnique.mockReset();
    prismaMock.video.update.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { title: "New" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when video not found", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/admin/videos/bad", {
      method: "PATCH",
      body: { title: "New" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "bad" }) });
    expect(res.status).toBe(404);
  });

  it("updates whitelisted fields only", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.update.mockResolvedValue(makeVideo({ title: "Updated" }));

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { title: "Updated", id: "hacked", notAllowed: "nope" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "v1" }) });

    expect(res.status).toBe(200);
    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(updateCall?.data.title).toBe("Updated");
    expect(updateCall?.data.id).toBeUndefined();
    expect(updateCall?.data.notAllowed).toBeUndefined();
  });

  it("converts array tags to JSON string", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { tags: ["a", "b"] },
    });
    await PATCH(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(updateCall?.data.tags).toBe('["a","b"]');
  });

  it("converts array glossary to JSON string", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { glossary: [{ term: "API", explain: "接続口" }] },
    });
    await PATCH(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(typeof updateCall?.data.glossary).toBe("string");
  });

  it("converts array deprecatedFlags to JSON string", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { deprecatedFlags: ["古い"] },
    });
    await PATCH(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(typeof updateCall?.data.deprecatedFlags).toBe("string");
  });

  it("recalculates BCI on update", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "PATCH",
      body: { difficulty: "hard" },
    });
    await PATCH(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(updateCall?.data.beginnerComfortIndex).toBeDefined();
    expect(typeof updateCall?.data.beginnerComfortIndex).toBe("number");
  });
});

describe("DELETE /api/admin/videos/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findUnique.mockReset();
    prismaMock.video.delete.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when video not found", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/admin/videos/bad", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "bad" }) });
    expect(res.status).toBe(404);
  });

  it("deletes video and returns success", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    prismaMock.video.delete.mockResolvedValue({});

    const req = createRequest("http://localhost:3010/api/admin/videos/v1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "v1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.id).toBe("v1");
  });
});
