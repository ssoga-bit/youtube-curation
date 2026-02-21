import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET, POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("GET /api/admin/paths", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.path.findMany.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns all paths with steps for admin", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Python入門",
        targetAudience: "初心者",
        goal: "基礎",
        totalTimeEstimate: 45,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: "s1",
            pathId: "p1",
            videoId: "v1",
            order: 1,
            whyThis: "基礎",
            checkpointQuestion: "?",
            video: {
              id: "v1",
              title: "Video",
              tags: '["python"]',
              glossary: null,
              deprecatedFlags: null,
            },
          },
        ],
      },
    ]);

    const res = await GET();
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.paths).toHaveLength(1);
    expect(body.paths[0].stepCount).toBe(1);
    expect(body.paths[0].steps[0].video.tags).toEqual(["python"]);
  });
});

describe("POST /api/admin/paths", () => {
  const validBody = {
    title: "New Path",
    targetAudience: "初心者",
    goal: "学習",
    totalTimeEstimate: 30,
    steps: [
      {
        videoId: "v1",
        order: 1,
        whyThis: "基礎だから",
        checkpointQuestion: "理解した?",
      },
    ],
  };

  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.path.create.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("creates path with valid data", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.create.mockResolvedValue({
      id: "p1",
      ...validBody,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [
        {
          id: "s1",
          pathId: "p1",
          videoId: "v1",
          order: 1,
          whyThis: "基礎だから",
          checkpointQuestion: "理解した?",
          video: {
            id: "v1",
            title: "Video",
            tags: "[]",
            glossary: null,
            deprecatedFlags: null,
          },
        },
      ],
    });

    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(201);
    expect(body.path.title).toBe("New Path");
    expect(body.path.stepCount).toBe(1);
  });

  it("returns 400 when title is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: { ...validBody, title: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when targetAudience is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: { ...validBody, targetAudience: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when goal is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: { ...validBody, goal: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when steps is empty", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: { ...validBody, steps: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when steps is not an array", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: { ...validBody, steps: "not-array" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when step is missing videoId", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: {
        ...validBody,
        steps: [
          {
            order: 1,
            whyThis: "reason",
            checkpointQuestion: "question",
          },
        ],
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when step is missing whyThis", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: {
        ...validBody,
        steps: [
          {
            videoId: "v1",
            order: 1,
            checkpointQuestion: "question",
          },
        ],
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("defaults isPublished to true", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.create.mockResolvedValue({
      id: "p1",
      ...validBody,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [],
    });

    const req = createRequest("http://localhost:3010/api/admin/paths", {
      method: "POST",
      body: validBody,
    });
    await POST(req);

    const createCall = prismaMock.path.create.mock.calls[0][0];
    expect(createCall?.data.isPublished).toBe(true);
  });
});
