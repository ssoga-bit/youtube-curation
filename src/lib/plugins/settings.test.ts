import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { getSummarizerConfig, saveSummarizerConfig } from "./settings";

describe("getSummarizerConfig", () => {
  it("returns default config when no DB setting found", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);
    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("dify");
    expect(config.pluginConfigs).toEqual({});
  });

  it("returns parsed config from DB", async () => {
    const stored = {
      activePlugin: "dify",
      pluginConfigs: {
        dify: { endpoint: "https://api.dify.ai/v1", apiKey: "app-xxx" },
      },
    };
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: JSON.stringify(stored),
    });

    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("dify");
    expect(config.pluginConfigs.dify.endpoint).toBe("https://api.dify.ai/v1");
  });

  it("returns default config when JSON is invalid", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: "not-valid-json",
    });
    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("dify");
  });

  it("defaults missing activePlugin", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: JSON.stringify({ pluginConfigs: {} }),
    });
    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("dify");
  });

  it("defaults missing pluginConfigs to empty object", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: JSON.stringify({ activePlugin: "claude" }),
    });
    const config = await getSummarizerConfig();
    expect(config.pluginConfigs).toEqual({});
  });
});

describe("saveSummarizerConfig", () => {
  it("upserts config to DB", async () => {
    prismaMock.appSetting.upsert.mockResolvedValue({
      id: "1",
      key: "summarizer-plugin",
      value: "{}",
    });

    const config = {
      activePlugin: "dify",
      pluginConfigs: { dify: { endpoint: "https://x.com", apiKey: "key" } },
    };
    await saveSummarizerConfig(config);

    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      where: { key: "summarizer-plugin" },
      update: { value: JSON.stringify(config) },
      create: { key: "summarizer-plugin", value: JSON.stringify(config) },
    });
  });
});
