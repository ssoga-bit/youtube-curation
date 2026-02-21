import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { PATCH } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };

describe("PATCH /api/admin/feedback/[id]", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.feedback.update.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: { resolved: true },
      }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "f1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 when resolved is not boolean", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: { resolved: "yes" },
      }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "f1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when resolved is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: {},
      }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "f1" }) });
    expect(res.status).toBe(400);
  });

  it("marks feedback as resolved", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.feedback.update.mockResolvedValue({
      id: "f1",
      videoId: "v1",
      type: "error",
      comment: null,
      resolved: true,
      createdAt: new Date(),
    });

    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: { resolved: true },
      }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "f1" }) });
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.feedback.resolved).toBe(true);
  });

  it("marks feedback as unresolved", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.feedback.update.mockResolvedValue({
      id: "f1",
      videoId: "v1",
      type: "error",
      comment: null,
      resolved: false,
      createdAt: new Date(),
    });

    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: { resolved: false },
      }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "f1" }) });
    const body = await parseJson<any>(res);

    expect(body.feedback.resolved).toBe(false);
  });

  it("calls prisma with correct id and data", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.feedback.update.mockResolvedValue({ id: "f1", resolved: true });

    const req = createRequest(
      "http://localhost:3010/api/admin/feedback/f1",
      {
        method: "PATCH",
        body: { resolved: true },
      }
    );
    await PATCH(req, { params: Promise.resolve({ id: "f1" }) });

    expect(prismaMock.feedback.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { resolved: true },
    });
  });
});
