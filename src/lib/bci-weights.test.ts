import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { getBCIWeights } from "./bci-weights";
import { DEFAULT_BCI_WEIGHTS } from "./bci";

describe("getBCIWeights", () => {
  it("returns default weights when no DB setting found", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);
    const weights = await getBCIWeights();
    expect(weights).toEqual(DEFAULT_BCI_WEIGHTS);
  });

  it("returns parsed weights from DB", async () => {
    const custom = { shortDuration: 25, hasCc: 10 };
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "bci-weights",
      value: JSON.stringify(custom),
    });
    const weights = await getBCIWeights();
    expect(weights.shortDuration).toBe(25);
    expect(weights.hasCc).toBe(10);
    // Defaults for non-overridden keys
    expect(weights.hasChapters).toBe(DEFAULT_BCI_WEIGHTS.hasChapters);
  });

  it("returns default weights when JSON is invalid", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "bci-weights",
      value: "not-valid-json",
    });
    const weights = await getBCIWeights();
    expect(weights).toEqual(DEFAULT_BCI_WEIGHTS);
  });

  it("merges partial DB weights with defaults", async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      id: "1",
      key: "bci-weights",
      value: JSON.stringify({ healthyLikeRatio: 5 }),
    });
    const weights = await getBCIWeights();
    expect(weights.healthyLikeRatio).toBe(5);
    expect(weights.shortDuration).toBe(DEFAULT_BCI_WEIGHTS.shortDuration);
    expect(weights.easyDifficulty).toBe(DEFAULT_BCI_WEIGHTS.easyDifficulty);
  });
});
