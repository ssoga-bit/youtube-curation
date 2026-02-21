import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";
import { GET } from "./route";

describe("GET /api/paths/[id]", () => {
  const makePath = (overrides = {}) => ({
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
        whyThis: "基礎",
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
    ...overrides,
  });

  beforeEach(() => {
    prismaMock.path.findUnique.mockReset();
  });

  it("returns path with steps and parsed videos", async () => {
    prismaMock.path.findUnique.mockResolvedValue(makePath());

    const req = createRequest("http://localhost:3010/api/paths/p1");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.path.title).toBe("Python入門");
    expect(body.path.steps).toHaveLength(1);
    expect(body.path.steps[0].video.tags).toEqual(["python"]);
  });

  it("returns 404 for non-existent path", async () => {
    prismaMock.path.findUnique.mockResolvedValue(null);

    const req = createRequest("http://localhost:3010/api/paths/bad");
    const res = await GET(req, { params: Promise.resolve({ id: "bad" }) });

    expect(res.status).toBe(404);
  });

  it("returns 404 for unpublished path", async () => {
    prismaMock.path.findUnique.mockResolvedValue(makePath({ isPublished: false }));

    const req = createRequest("http://localhost:3010/api/paths/p1");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });

    expect(res.status).toBe(404);
  });

  it("orders steps by order asc", async () => {
    prismaMock.path.findUnique.mockResolvedValue(makePath());

    const req = createRequest("http://localhost:3010/api/paths/p1");
    await GET(req, { params: Promise.resolve({ id: "p1" }) });

    const call = prismaMock.path.findUnique.mock.calls[0][0];
    expect(call?.include?.steps?.orderBy).toEqual({ order: "asc" });
  });
});
