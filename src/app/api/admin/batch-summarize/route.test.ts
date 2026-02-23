import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auto-summarize", () => ({
  autoSummarize: vi.fn().mockResolvedValue(undefined),
}));

import { getServerSession } from "next-auth";
import { POST } from "./route";
import { autoSummarize } from "@/lib/auto-summarize";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockAutoSummarize = autoSummarize as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

// Helper to create a minimal Request for adminHandler (no body needed)
function createPostRequest() {
  return new Request("http://localhost:3010/api/admin/batch-summarize", {
    method: "POST",
  });
}

describe("POST /api/admin/batch-summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(adminSession);
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const res = await POST(createPostRequest() as any);
    expect(res.status).toBe(403);
  });

  it("returns queued: 0 when all videos have summaries", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);

    const res = await POST(createPostRequest() as any);
    const body = await res.json();

    expect(body.queued).toBe(0);
    expect(mockAutoSummarize).not.toHaveBeenCalled();
  });

  it("queues autoSummarize for videos without summaries", async () => {
    prismaMock.video.findMany.mockResolvedValue([
      { id: "v1", url: "https://youtube.com/watch?v=aaa", title: "Video 1" },
      { id: "v2", url: "https://youtube.com/watch?v=bbb", title: "Video 2" },
    ]);

    const res = await POST(createPostRequest() as any);
    const body = await res.json();

    expect(body.queued).toBe(2);
    expect(mockAutoSummarize).toHaveBeenCalledTimes(2);
    expect(mockAutoSummarize).toHaveBeenCalledWith(
      "v1", "https://youtube.com/watch?v=aaa", "Video 1"
    );
    expect(mockAutoSummarize).toHaveBeenCalledWith(
      "v2", "https://youtube.com/watch?v=bbb", "Video 2"
    );
  });
});
