import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/youtube", () => ({
  extractVideoId: vi.fn(),
  fetchVideoMeta: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube";
import { POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockExtract = extractVideoId as ReturnType<typeof vi.fn>;
const mockFetch = fetchVideoMeta as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("POST /api/admin/youtube-lookup", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockSession.mockResolvedValue(adminSession);
    mockExtract.mockReset();
    mockFetch.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: { url: "https://youtube.com/watch?v=abc" } }
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: { url: "https://youtube.com/watch?v=abc" } }
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when url is missing", async () => {
    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: {} }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid YouTube URL", async () => {
    mockExtract.mockReturnValue(null);
    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: { url: "https://example.com/not-youtube" } }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when video meta not found", async () => {
    mockExtract.mockReturnValue("abc123");
    mockFetch.mockResolvedValue(null);
    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: { url: "https://youtube.com/watch?v=abc123" } }
    );
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns meta on success", async () => {
    const meta = {
      title: "テスト動画",
      channel: "テストチャンネル",
      durationMin: 10,
      publishedAt: "2025-01-01T00:00:00Z",
      language: "ja",
      hasCc: true,
      hasChapters: false,
      tags: ["test"],
    };
    mockExtract.mockReturnValue("abc123");
    mockFetch.mockResolvedValue(meta);

    const req = createRequest(
      "http://localhost:3010/api/admin/youtube-lookup",
      { method: "POST", body: { url: "https://youtube.com/watch?v=abc123" } }
    );
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.meta.title).toBe("テスト動画");
    expect(body.meta.hasCc).toBe(true);
  });
});
