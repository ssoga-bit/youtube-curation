import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET, PATCH, DELETE } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

const mockPath = {
  id: "p1",
  title: "Python入門",
  targetAudience: "初心者",
  goal: "基礎を学ぶ",
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
      whyThis: "基礎だから",
      checkpointQuestion: "理解した?",
      video: {
        id: "v1",
        title: "Video 1",
        tags: '["python"]',
        glossary: null,
        deprecatedFlags: null,
      },
    },
  ],
};

describe("GET /api/admin/paths/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.path.findUnique.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/paths/p1");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when path does not exist", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/admin/paths/missing");
    const res = await GET(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 with path and steps", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue(mockPath);
    const req = createRequest("http://localhost:3010/api/admin/paths/p1");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.path.title).toBe("Python入門");
    expect(body.path.stepCount).toBe(1);
    expect(body.path.steps[0].video.tags).toEqual(["python"]);
  });
});

describe("PATCH /api/admin/paths/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.path.findUnique.mockReset();
    prismaMock.path.update.mockReset();
    prismaMock.$transaction.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/paths/p1", {
      method: "PATCH",
      body: { title: "Updated" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when path does not exist", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/admin/paths/missing", {
      method: "PATCH",
      body: { title: "Updated" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("updates fields only (no steps)", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue({ id: "p1" });
    prismaMock.path.update.mockResolvedValue({
      ...mockPath,
      title: "Updated Title",
    });

    const req = createRequest("http://localhost:3010/api/admin/paths/p1", {
      method: "PATCH",
      body: { title: "Updated Title" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.path.title).toBe("Updated Title");
  });

  it("replaces steps via transaction", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue({ id: "p1" });
    prismaMock.$transaction.mockResolvedValue({
      ...mockPath,
      title: "Updated",
      steps: [
        {
          id: "s2",
          pathId: "p1",
          videoId: "v2",
          order: 1,
          whyThis: "New reason",
          checkpointQuestion: "New Q?",
          video: {
            id: "v2",
            title: "Video 2",
            tags: "[]",
            glossary: null,
            deprecatedFlags: null,
          },
        },
      ],
    });

    const req = createRequest("http://localhost:3010/api/admin/paths/p1", {
      method: "PATCH",
      body: {
        title: "Updated",
        steps: [
          {
            videoId: "v2",
            order: 1,
            whyThis: "New reason",
            checkpointQuestion: "New Q?",
          },
        ],
      },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.path.steps).toHaveLength(1);
    expect(body.path.steps[0].video.id).toBe("v2");
  });
});

describe("DELETE /api/admin/paths/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.path.findUnique.mockReset();
    prismaMock.path.delete.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest("http://localhost:3010/api/admin/paths/p1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when path does not exist", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue(null);
    const req = createRequest("http://localhost:3010/api/admin/paths/missing", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("deletes path successfully", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.path.findUnique.mockResolvedValue({ id: "p1" });
    prismaMock.path.delete.mockResolvedValue({ id: "p1" });
    const req = createRequest("http://localhost:3010/api/admin/paths/p1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "p1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.id).toBe("p1");
  });
});
