import { describe, it, expect } from "vitest";
import {
  calculateBCI,
  getBCILabel,
  DEFAULT_BCI_WEIGHTS,
  BCIFactors,
  BCIWeights,
} from "./bci";

function makeFactors(overrides: Partial<BCIFactors> = {}): BCIFactors {
  return {
    durationMin: 10,
    hasCc: true,
    hasChapters: true,
    difficulty: "easy",
    publishedAt: new Date(), // recent
    hasSampleCode: true,
    likeRatio: 0.95,
    ...overrides,
  };
}

describe("calculateBCI", () => {
  it("returns max score (100) for perfect beginner-friendly video", () => {
    const score = calculateBCI(makeFactors());
    expect(score).toBe(100);
  });

  it("uses DEFAULT_BCI_WEIGHTS when no weights provided", () => {
    const score = calculateBCI(makeFactors());
    // All factors maxed: 20+15+15+20+10+10+10 = 100
    expect(score).toBe(100);
  });

  // Duration tests
  it("gives full duration points for <= 15 min", () => {
    const score = calculateBCI(makeFactors({ durationMin: 15 }));
    expect(score).toBe(100);
  });

  it("gives half duration points for 16-30 min", () => {
    const score = calculateBCI(makeFactors({ durationMin: 20 }));
    // 20*0.5=10 instead of 20, so 100-10=90
    expect(score).toBe(90);
  });

  it("gives half duration points for exactly 30 min", () => {
    const score = calculateBCI(makeFactors({ durationMin: 30 }));
    expect(score).toBe(90);
  });

  it("gives 0 duration points for > 30 min", () => {
    const score = calculateBCI(makeFactors({ durationMin: 60 }));
    // 0 instead of 20, so 100-20=80
    expect(score).toBe(80);
  });

  // CC tests
  it("gives 0 cc points when hasCc is false", () => {
    const score = calculateBCI(makeFactors({ hasCc: false }));
    expect(score).toBe(85);
  });

  // Chapters tests
  it("gives 0 chapter points when hasChapters is false", () => {
    const score = calculateBCI(makeFactors({ hasChapters: false }));
    expect(score).toBe(85);
  });

  // Difficulty tests
  it("gives full points for easy difficulty", () => {
    const score = calculateBCI(makeFactors({ difficulty: "easy" }));
    expect(score).toBe(100);
  });

  it("gives half points for normal difficulty", () => {
    const score = calculateBCI(makeFactors({ difficulty: "normal" }));
    // 20*0.5=10 instead of 20, so 100-10=90
    expect(score).toBe(90);
  });

  it("gives 0 points for hard difficulty", () => {
    const score = calculateBCI(makeFactors({ difficulty: "hard" }));
    // 0 instead of 20, so 100-20=80
    expect(score).toBe(80);
  });

  // Published date tests
  it("gives recent points for video published within 2 years", () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 6);
    const score = calculateBCI(makeFactors({ publishedAt: recent }));
    expect(score).toBe(100);
  });

  it("gives 0 recent points for video older than 2 years", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 3);
    const score = calculateBCI(makeFactors({ publishedAt: old }));
    expect(score).toBe(90);
  });

  // Sample code tests
  it("gives 0 sample code points when hasSampleCode is false", () => {
    const score = calculateBCI(makeFactors({ hasSampleCode: false }));
    expect(score).toBe(90);
  });

  // Like ratio tests
  it("gives full like points for ratio >= 0.9", () => {
    const score = calculateBCI(makeFactors({ likeRatio: 0.9 }));
    expect(score).toBe(100);
  });

  it("gives half like points for ratio 0.8-0.89", () => {
    const score = calculateBCI(makeFactors({ likeRatio: 0.85 }));
    // 10*0.5=5 instead of 10, so 100-5=95
    expect(score).toBe(95);
  });

  it("gives half like points for exactly 0.8", () => {
    const score = calculateBCI(makeFactors({ likeRatio: 0.8 }));
    expect(score).toBe(95);
  });

  it("gives 0 like points for ratio < 0.8", () => {
    const score = calculateBCI(makeFactors({ likeRatio: 0.5 }));
    expect(score).toBe(90);
  });

  // Worst case scenario
  it("returns 0 for worst-case video", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 5);
    const score = calculateBCI(
      makeFactors({
        durationMin: 120,
        hasCc: false,
        hasChapters: false,
        difficulty: "hard",
        publishedAt: old,
        hasSampleCode: false,
        likeRatio: 0.3,
      })
    );
    expect(score).toBe(0);
  });

  // Score capped at 100
  it("caps score at 100 even with extreme weights", () => {
    const bigWeights: BCIWeights = {
      shortDuration: 30,
      hasCc: 30,
      hasChapters: 30,
      easyDifficulty: 30,
      recentPublish: 30,
      hasSampleCode: 30,
      healthyLikeRatio: 30,
    };
    const score = calculateBCI(makeFactors(), bigWeights);
    expect(score).toBe(100);
  });

  // Custom weights
  it("uses custom weights when provided", () => {
    const customWeights: BCIWeights = {
      shortDuration: 0,
      hasCc: 0,
      hasChapters: 0,
      easyDifficulty: 0,
      recentPublish: 0,
      hasSampleCode: 0,
      healthyLikeRatio: 0,
    };
    const score = calculateBCI(makeFactors(), customWeights);
    expect(score).toBe(0);
  });
});

describe("getBCILabel", () => {
  it("returns '超入門に最適' for score >= 70", () => {
    const result = getBCILabel(70);
    expect(result.label).toBe("超入門に最適");
    expect(result.className).toBe("badge-beginner");
  });

  it("returns '超入門に最適' for score 100", () => {
    const result = getBCILabel(100);
    expect(result.label).toBe("超入門に最適");
  });

  it("returns '入門OK' for score >= 50 and < 70", () => {
    const result = getBCILabel(50);
    expect(result.label).toBe("入門OK");
    expect(result.className).toBe("badge-intro");
  });

  it("returns '入門OK' for score 69", () => {
    const result = getBCILabel(69);
    expect(result.label).toBe("入門OK");
  });

  it("returns empty label for score < 50", () => {
    const result = getBCILabel(49);
    expect(result.label).toBe("");
    expect(result.className).toBe("");
  });

  it("returns empty label for score 0", () => {
    const result = getBCILabel(0);
    expect(result.label).toBe("");
  });
});
