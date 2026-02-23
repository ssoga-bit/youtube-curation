import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const mockFetchTranscript = vi.fn();
vi.mock("@/lib/youtube", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/youtube")>();
  return {
    ...actual,
    fetchTranscript: (...args: unknown[]) => mockFetchTranscript(...args),
  };
});

import { getServerSession } from "next-auth";
import { GET } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

const makeVideo = (overrides = {}) => ({
  id: "v1",
  title: "Test Video",
  url: "https://www.youtube.com/watch?v=abc123",
  durationMin: 10,
  hasCc: true,
  hasChapters: false,
  hasSampleCode: false,
  difficulty: "easy",
  publishedAt: new Date("2024-01-01"),
  likeRatio: 0.9,
  tags: '["python"]',
  ...overrides,
});

describe("GET /api/admin/videos/[id]/transcript", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.video.findUnique.mockReset();
    mockFetchTranscript.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/transcript",
    );
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when video not found", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/bad/transcript",
    );
    const res = await GET(req, { params: Promise.resolve({ id: "bad" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when YouTube ID cannot be extracted", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(
      makeVideo({ url: "not-a-youtube-url" }),
    );

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/transcript",
    );
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when transcript is not available", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    mockFetchTranscript.mockResolvedValue(null);

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/transcript",
    );
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(404);
    const body = await parseJson<{ error: string }>(res);
    expect(body.error).toContain("字幕を取得できませんでした");
  });

  it("returns transcript on success", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockResolvedValue(makeVideo());
    mockFetchTranscript.mockResolvedValue("これはテスト字幕です");

    const req = createRequest(
      "http://localhost:3010/api/admin/videos/v1/transcript",
    );
    const res = await GET(req, { params: Promise.resolve({ id: "v1" }) });
    expect(res.status).toBe(200);
    const body = await parseJson<{ transcript: string }>(res);
    expect(body.transcript).toBe("これはテスト字幕です");
    expect(mockFetchTranscript).toHaveBeenCalledWith("abc123");
  });
});
