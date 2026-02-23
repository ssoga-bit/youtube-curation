import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { parseJson } from "@/test/helpers";
import { GET } from "./route";

describe("GET /api/tags", () => {
  beforeEach(() => {
    prismaMock.video.findMany.mockResolvedValue([]);
  });

  it("returns unique tags sorted by frequency", async () => {
    prismaMock.video.findMany.mockResolvedValue([
      { tags: '["python", "ai"]' },
      { tags: '["python", "ml"]' },
      { tags: '["ai", "data"]' },
    ] as any);

    const res = await GET();
    const body = await parseJson<{ tags: string[] }>(res);

    expect(res.status).toBe(200);
    // python: 2, ai: 2, ml: 1, data: 1
    expect(body.tags[0]).toBe("python"); // or "ai" (both have count 2)
    expect(body.tags).toContain("python");
    expect(body.tags).toContain("ai");
    expect(body.tags).toContain("ml");
    expect(body.tags).toContain("data");
    expect(body.tags).toHaveLength(4);
  });

  it("returns empty array when no videos exist", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);

    const res = await GET();
    const body = await parseJson<{ tags: string[] }>(res);

    expect(res.status).toBe(200);
    expect(body.tags).toEqual([]);
  });

  it("handles invalid JSON tags gracefully", async () => {
    prismaMock.video.findMany.mockResolvedValue([
      { tags: "not-json" },
      { tags: '["python"]' },
    ] as any);

    const res = await GET();
    const body = await parseJson<{ tags: string[] }>(res);

    expect(res.status).toBe(200);
    expect(body.tags).toEqual(["python"]);
  });

  it("normalizes tags to lowercase", async () => {
    prismaMock.video.findMany.mockResolvedValue([
      { tags: '["Python", "AI"]' },
      { tags: '["python"]' },
    ] as any);

    const res = await GET();
    const body = await parseJson<{ tags: string[] }>(res);

    expect(body.tags).toContain("python");
    expect(body.tags).toContain("ai");
    // "Python" and "python" should merge
    expect(body.tags.filter((t) => t === "python")).toHaveLength(1);
  });

  it("only queries published videos", async () => {
    await GET();

    const call = prismaMock.video.findMany.mock.calls[0][0];
    expect(call?.where).toEqual({ isPublished: true });
  });
});
