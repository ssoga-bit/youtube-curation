export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  VIDEOS_PER_PAGE: 12,
  ADMIN_VIDEOS_DEFAULT_LIMIT: 50,
  RECENT_WATCH_LIMIT: 20,
} as const;

export const DURATION_THRESHOLDS = {
  SHORT: 10,
  MEDIUM: 30,
} as const;

export const BCI_LABEL_THRESHOLDS = {
  EXCELLENT: 70,
  GOOD: 50,
} as const;

export const LIKE_RATIO_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.8,
} as const;
