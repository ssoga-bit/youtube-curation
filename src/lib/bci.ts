/**
 * Beginner Comfort Index (BCI) calculation
 * Score 0-100 based on various factors
 */

import { BCI_LABEL_THRESHOLDS, LIKE_RATIO_THRESHOLDS } from "@/lib/constants";

export interface BCIFactors {
  durationMin: number;
  hasCc: boolean;
  hasChapters: boolean;
  difficulty: "easy" | "normal" | "hard";
  publishedAt: Date;
  hasSampleCode: boolean;
  likeRatio: number; // 0-1
}

export interface BCIWeights {
  shortDuration: number;    // default 20
  hasCc: number;            // default 15
  hasChapters: number;      // default 15
  easyDifficulty: number;   // default 20
  recentPublish: number;    // default 10
  hasSampleCode: number;    // default 10
  healthyLikeRatio: number; // default 10
}

export const DEFAULT_BCI_WEIGHTS: BCIWeights = {
  shortDuration: 20,
  hasCc: 15,
  hasChapters: 15,
  easyDifficulty: 20,
  recentPublish: 10,
  hasSampleCode: 10,
  healthyLikeRatio: 10,
};

export function calculateBCI(
  factors: BCIFactors,
  weights: BCIWeights = DEFAULT_BCI_WEIGHTS
): number {
  let score = 0;

  // Duration <= 15 min
  if (factors.durationMin <= 15) {
    score += weights.shortDuration;
  } else if (factors.durationMin <= 30) {
    score += weights.shortDuration * 0.5;
  }

  // Has closed captions
  if (factors.hasCc) {
    score += weights.hasCc;
  }

  // Has chapters
  if (factors.hasChapters) {
    score += weights.hasChapters;
  }

  // Difficulty level
  if (factors.difficulty === "easy") {
    score += weights.easyDifficulty;
  } else if (factors.difficulty === "normal") {
    score += weights.easyDifficulty * 0.5;
  }

  // Published within 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (factors.publishedAt >= twoYearsAgo) {
    score += weights.recentPublish;
  }

  // Has sample code
  if (factors.hasSampleCode) {
    score += weights.hasSampleCode;
  }

  // Healthy like ratio
  if (factors.likeRatio >= LIKE_RATIO_THRESHOLDS.HIGH) {
    score += weights.healthyLikeRatio;
  } else if (factors.likeRatio >= LIKE_RATIO_THRESHOLDS.MEDIUM) {
    score += weights.healthyLikeRatio * 0.5;
  }

  return Math.min(100, Math.round(score));
}

export function getBCILabel(score: number): { label: string; className: string } {
  if (score >= BCI_LABEL_THRESHOLDS.EXCELLENT) {
    return { label: "超入門に最適", className: "badge-beginner" };
  }
  if (score >= BCI_LABEL_THRESHOLDS.GOOD) {
    return { label: "入門OK", className: "badge-intro" };
  }
  return { label: "", className: "" };
}
