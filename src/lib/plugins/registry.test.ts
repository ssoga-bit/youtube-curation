import { describe, it, expect } from "vitest";
import { getPlugin, getAllPlugins } from "./registry";

describe("registry", () => {
  describe("getPlugin", () => {
    it("returns claude plugin", () => {
      const plugin = getPlugin("claude");
      expect(plugin).toBeDefined();
      expect(plugin!.key).toBe("claude");
      expect(plugin!.name).toBe("Claude (Direct API)");
    });

    it("returns dify plugin", () => {
      const plugin = getPlugin("dify");
      expect(plugin).toBeDefined();
      expect(plugin!.key).toBe("dify");
      expect(plugin!.name).toBe("Dify Workflow");
    });

    it("returns undefined for unknown key", () => {
      expect(getPlugin("unknown")).toBeUndefined();
    });
  });

  describe("getAllPlugins", () => {
    it("returns all registered plugins", () => {
      const plugins = getAllPlugins();
      expect(plugins.length).toBeGreaterThanOrEqual(2);
      const keys = plugins.map((p) => p.key);
      expect(keys).toContain("claude");
      expect(keys).toContain("dify");
    });

    it("each plugin has required fields", () => {
      for (const plugin of getAllPlugins()) {
        expect(plugin.key).toBeTruthy();
        expect(plugin.name).toBeTruthy();
        expect(Array.isArray(plugin.configSchema)).toBe(true);
        expect(typeof plugin.summarize).toBe("function");
      }
    });
  });
});
