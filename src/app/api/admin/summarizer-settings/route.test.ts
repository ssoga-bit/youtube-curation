import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { createRequest, parseJson } from "@/test/helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { GET, PUT } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: "admin1", role: "admin" } };
const userSession = { user: { id: "u1", role: "user" } };

describe("GET /api/admin/summarizer-settings", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.appSetting.findUnique.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue(userSession);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns default config and plugin list when no DB setting", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.config.activePlugin).toBe("dify");
    expect(body.config.pluginConfigs).toEqual({});
    expect(body.plugins.length).toBeGreaterThanOrEqual(2);

    const keys = body.plugins.map((p: any) => p.key);
    expect(keys).toContain("claude");
    expect(keys).toContain("dify");
  });

  it("returns stored config from DB", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: JSON.stringify({
        activePlugin: "dify",
        pluginConfigs: {
          dify: { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" },
        },
      }),
    });

    const res = await GET();
    const body = await parseJson<any>(res);

    expect(body.config.activePlugin).toBe("dify");
    expect(body.config.pluginConfigs.dify.endpoint).toBe(
      "https://api.dify.ai/v1"
    );
  });

  it("each plugin has configSchema", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await parseJson<any>(res);

    for (const plugin of body.plugins) {
      expect(plugin.key).toBeTruthy();
      expect(plugin.name).toBeTruthy();
      expect(Array.isArray(plugin.configSchema)).toBe(true);
    }
  });
});

describe("PUT /api/admin/summarizer-settings", () => {
  beforeEach(() => {
    mockSession.mockReset();
    prismaMock.appSetting.findUnique.mockReset();
    prismaMock.appSetting.upsert.mockReset();
  });

  it("returns 403 for non-admin", async () => {
    mockSession.mockResolvedValue(userSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: { activePlugin: "claude" },
      }
    );
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when activePlugin is missing", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: {},
      }
    );
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown plugin", async () => {
    mockSession.mockResolvedValue(adminSession);
    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: { activePlugin: "nonexistent" },
      }
    );
    const res = await PUT(req);
    const body = await parseJson<any>(res);
    expect(res.status).toBe(400);
    expect(body.error).toContain("Unknown plugin");
  });

  it("saves valid config", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: "{}",
    });

    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: {
          activePlugin: "dify",
          pluginConfigs: {
            dify: { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" },
          },
        },
      }
    );
    const res = await PUT(req);
    const body = await parseJson<any>(res);

    expect(res.status).toBe(200);
    expect(body.config.activePlugin).toBe("dify");
    expect(prismaMock.appSetting.upsert).toHaveBeenCalled();
  });

  it("accepts claude plugin", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: "{}",
    });

    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: { activePlugin: "claude" },
      }
    );
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it("defaults pluginConfigs to empty object when not provided", async () => {
    mockSession.mockResolvedValue(adminSession);
    prismaMock.appSetting.upsert.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: "{}",
    });

    const req = createRequest(
      "http://localhost:3010/api/admin/summarizer-settings",
      {
        method: "PUT",
        body: { activePlugin: "claude" },
      }
    );
    await PUT(req);

    const upsertCall = prismaMock.appSetting.upsert.mock.calls[0][0];
    const savedValue = JSON.parse(upsertCall.update.value);
    expect(savedValue.pluginConfigs).toEqual({});
  });
});
