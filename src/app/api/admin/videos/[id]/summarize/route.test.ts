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

const mockGenerateSummary = vi.fn();
vi.mock("@/lib/llm", () => ({
  generateVideoSummary: (...args: unknown[]) => mockGenerateSummary(...args),
}));

import { getServerSession } from "next-auth";
import { POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

const makeVideo = (overrides = {}) => ({
  id: "v1",
  title: "Test Video",
  durationMin: 10,
  hasCc: true,
  hasChapters: false,
  hasSampleCode: false,
  difficulty: "easy",
  publishedAt: new Date("2024-01-01"),
  likeRatio: 0.9,
  tags: '["python"]',
  glossary: null,
  deprecatedFlags: null,
  ...overrides,
});

describe("POST /api/admin/videos/[id]/summarize", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findUnique.mockReset();
    prismaMock.video.update.mockReset();
    mockGenerateSummary.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: { transcript: "text" },
      }
    );
    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 when transcript is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: {},
      }
    );
    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when transcript is not a string", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: { transcript: 123 },
      }
    );
    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when video not found", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/bad/summarize",
      {
        method: "POST",
        body: { transcript: "text" },
      }
    );
    const res = await POST(req, { params: Promise.resolve({ id: "bad" }) });
    expect(res.status).toBe(404);
  });

  it("calls LLM and updates video", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());

    const llmResult = {
      transcriptSummary: "まとめ",
      glossary: [{ term: "API", explain: "接続口" }],
      difficulty: "easy" as const,
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: ["学び"],
    };
    mockGenerateSummary.mockResolvedValue(llmResult);
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: { transcript: "転写テキスト" },
      }
    );
    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.llmResult).toBeDefined();
    expect(mockGenerateSummary).toHaveBeenCalledWith("Test Video", "転写テキスト");
  });

  it("recalculates BCI with new difficulty", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    mockGenerateSummary.mockResolvedValue({
      transcriptSummary: "まとめ",
      glossary: [],
      difficulty: "hard",
      deprecatedFlags: [],
      prerequisites: "不要",
      learnings: [],
    });
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: { transcript: "text" },
      }
    );
    await POST(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(updateCall?.data.beginnerComfortIndex).toBeDefined();
    expect(updateCall?.data.difficulty).toBe("hard");
  });

  it("stores glossary as JSON string", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    mockGenerateSummary.mockResolvedValue({
      transcriptSummary: "まとめ",
      glossary: [{ term: "API", explain: "接続口" }],
      difficulty: "easy",
      deprecatedFlags: ["注意"],
      prerequisites: "不要",
      learnings: [],
    });
    prismaMock.video.update.mockResolvedValue(makeVideo());

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/summarize",
      {
        method: "POST",
        body: { transcript: "text" },
      }
    );
    await POST(req, { params: Promise.resolve({ id: "v1" }) });

    const updateCall = prismaMock.video.update.mock.calls[0][0];
    expect(typeof updateCall?.data.glossary).toBe("string");
    expect(typeof updateCall?.data.deprecatedFlags).toBe("string");
  });
});
