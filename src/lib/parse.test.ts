import { describe, it, expect } from "vitest";
import { parseVideoJson } from "./parse";

describe("parseVideoJson", () => {
  it("parses tags from JSON string", () => {
    const result = parseVideoJson({
      id: "1",
      tags: '["python","ai"]',
      glossary: null,
      deprecatedFlags: null,
    });
    expect(result.tags).toEqual(["python", "ai"]);
  });

  it("parses glossary from JSON string", () => {
    const result = parseVideoJson({
      id: "1",
      tags: "[]",
      glossary: '[{"term":"API","explain":"接続口"}]',
      deprecatedFlags: null,
    });
    expect(result.glossary).toEqual([{ term: "API", explain: "接続口" }]);
  });

  it("parses deprecatedFlags from JSON string", () => {
    const result = parseVideoJson({
      id: "1",
      tags: "[]",
      glossary: null,
      deprecatedFlags: '["古いAPI"]',
    });
    expect(result.deprecatedFlags).toEqual(["古いAPI"]);
  });

  it("defaults tags to empty array when null", () => {
    const result = parseVideoJson({
      id: "1",
      tags: null,
      glossary: null,
      deprecatedFlags: null,
    });
    expect(result.tags).toEqual([]);
  });

  it("defaults tags to empty array when empty string", () => {
    const result = parseVideoJson({
      id: "1",
      tags: "",
      glossary: null,
      deprecatedFlags: null,
    });
    expect(result.tags).toEqual([]);
  });

  it("returns null for glossary when null", () => {
    const result = parseVideoJson({
      id: "1",
      tags: "[]",
      glossary: null,
      deprecatedFlags: null,
    });
    expect(result.glossary).toBeNull();
  });

  it("returns null for deprecatedFlags when null", () => {
    const result = parseVideoJson({
      id: "1",
      tags: "[]",
      glossary: null,
      deprecatedFlags: null,
    });
    expect(result.deprecatedFlags).toBeNull();
  });

  it("preserves other fields", () => {
    const result = parseVideoJson({
      id: "vid1",
      title: "Test Video",
      channel: "Test Channel",
      tags: "[]",
      glossary: null,
      deprecatedFlags: null,
    });
    expect((result as Record<string, unknown>).id).toBe("vid1");
    expect((result as Record<string, unknown>).title).toBe("Test Video");
    expect((result as Record<string, unknown>).channel).toBe("Test Channel");
  });
});
