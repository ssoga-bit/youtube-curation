import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { POST, GET } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const adminSession = { user: { id: "admin1", role: "admin" } };

describe("POST /api/feedback", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockSession.mockResolvedValue(adminSession);
    prismaMock.video.findUnique.mockReset();
    prismaMock.feedback.create.mockReset();
  });

  it("returns 401 for unauthenticated user", async () => {
    mockSession.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "v1", type: "difficult" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("creates feedback with valid data", async () => {
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
    prismaMock.feedback.create.mockResolvedValue({
      id: "f1",
      videoId: "v1",
      type: "difficult",
      comment: "Too fast",
      resolved: false,
      createdAt: new Date(),
    });

    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "v1", type: "difficult", comment: "Too fast" },
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(201);
    expect(body.feedback.type).toBe("difficult");
  });

  it("returns 400 when videoId is missing", async () => {
    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { type: "error" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when type is missing", async () => {
    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "v1" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "v1", type: "invalid-type" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseJson<any>(res);
    expect(body.error).toContain("type must be one of");
  });

  it("accepts all 4 valid types", async () => {
    for (const type of ["difficult", "error", "broken_link", "outdated"]) {
      prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
      prismaMock.feedback.create.mockResolvedValue({
        id: "f1",
        videoId: "v1",
        type,
        comment: null,
        resolved: false,
        createdAt: new Date(),
      });

      const req = createRequest("http://localhost:3010/api/feedback", {
        method: "POST",
        body: { videoId: "v1", type },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it("returns 404 when video does not exist", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "nonexistent", type: "error" },
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("creates feedback with null comment when not provided", async () => {
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1" });
    prismaMock.feedback.create.mockResolvedValue({
      id: "f1",
      videoId: "v1",
      type: "error",
      comment: null,
      resolved: false,
      createdAt: new Date(),
    });

    const req = createRequest("http://localhost:3010/api/feedback", {
      method: "POST",
      body: { videoId: "v1", type: "error" },
    });
    await POST(req);

    expect(prismaMock.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ comment: null, userId: "admin1" }),
      })
    );
  });
});

describe("GET /api/feedback", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockSession.mockResolvedValue(adminSession);
    prismaMock.feedback.findMany.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/feedback");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/feedback");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns all feedbacks", async () => {
    prismaMock.feedback.findMany.mockResolvedValue([
      {
        id: "f1",
        videoId: "v1",
        type: "error",
        comment: null,
        resolved: false,
        createdAt: new Date(),
        video: { id: "v1", title: "Test", channel: "Ch" },
      },
    ]);

    const req = createRequest("http://localhost:3010/api/feedback");
    const res = await GET(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.feedbacks).toHaveLength(1);
  });

  it("filters by resolved=true", async () => {
    prismaMock.feedback.findMany.mockResolvedValue([]);

    const req = createRequest("http://localhost:3010/api/feedback?resolved=true");
    await GET(req);

    const call = prismaMock.feedback.findMany.mock.calls[0][0];
    expect(call?.where?.resolved).toBe(true);
  });

  it("filters by resolved=false", async () => {
    prismaMock.feedback.findMany.mockResolvedValue([]);

    const req = createRequest("http://localhost:3010/api/feedback?resolved=false");
    await GET(req);

    const call = prismaMock.feedback.findMany.mock.calls[0][0];
    expect(call?.where?.resolved).toBe(false);
  });

  it("returns all when resolved param not specified", async () => {
    prismaMock.feedback.findMany.mockResolvedValue([]);

    const req = createRequest("http://localhost:3010/api/feedback");
    await GET(req);

    const call = prismaMock.feedback.findMany.mock.calls[0][0];
    expect(call?.where?.resolved).toBeUndefined();
  });
});
