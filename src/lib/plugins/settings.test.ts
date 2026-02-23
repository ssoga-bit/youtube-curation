import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSummarizerConfig } from "./settings";

describe("getSummarizerConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SUMMARIZER_PLUGIN;
    delete process.env.DIFY_ENDPOINT;
    delete process.env.DIFY_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns default activePlugin 'dify' when SUMMARIZER_PLUGIN is not set", async () => {
    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("dify");
  });

  it("returns activePlugin from SUMMARIZER_PLUGIN env var", async () => {
    process.env.SUMMARIZER_PLUGIN = "claude";
    const config = await getSummarizerConfig();
    expect(config.activePlugin).toBe("claude");
  });

  it("returns dify config from env vars", async () => {
    process.env.DIFY_ENDPOINT = "https://api.dify.ai/v1";
    process.env.DIFY_API_KEY = "app-xxx";
    const config = await getSummarizerConfig();
    expect(config.pluginConfigs.dify.endpoint).toBe("https://api.dify.ai/v1");
    expect(config.pluginConfigs.dify.apiKey).toBe("app-xxx");
  });

  it("returns claude config from env vars", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-xxx";
    process.env.CLAUDE_MODEL = "claude-opus-4-20250514";
    const config = await getSummarizerConfig();
    expect(config.pluginConfigs.claude.apiKey).toBe("sk-ant-xxx");
    expect(config.pluginConfigs.claude.model).toBe("claude-opus-4-20250514");
  });

  it("returns empty strings when env vars are not set", async () => {
    const config = await getSummarizerConfig();
    expect(config.pluginConfigs.dify.endpoint).toBe("");
    expect(config.pluginConfigs.dify.apiKey).toBe("");
    expect(config.pluginConfigs.claude.apiKey).toBe("");
    expect(config.pluginConfigs.claude.model).toBe("");
  });
});
