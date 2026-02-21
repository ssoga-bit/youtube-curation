import { z } from "zod";

// ============================================================
// 共通ヘルパー
// ============================================================

/**
 * zod バリデーション結果を処理し、
 * 成功時は data を、失敗時は NextResponse 用のオブジェクトを返す
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: "Validation error",
    details: result.error.issues,
  };
}

// ============================================================
// POST /api/feedback
// ============================================================
export const feedbackCreateSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  type: z.enum(["difficult", "error", "broken_link", "outdated"], {
    error: "type must be one of: difficult, error, broken_link, outdated",
  }),
  comment: z.string().max(1000).optional(),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;

// ============================================================
// POST /api/progress
// ============================================================
export const progressUpsertSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  watched: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
});

export type ProgressUpsertInput = z.infer<typeof progressUpsertSchema>;

// ============================================================
// POST /api/import
// ============================================================
const importVideoSchema = z.object({
  url: z.string().min(1, "url is required"),
  title: z.string().optional(),
  channel: z.string().optional(),
  language: z.string().optional(),
  durationMin: z.number().optional(),
  publishedAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  memo: z.string().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const importBodySchema = z.union([
  z.array(importVideoSchema),
  z.object({
    videos: z.array(importVideoSchema),
  }),
]);

export type ImportVideoInput = z.infer<typeof importVideoSchema>;

// ============================================================
// PATCH /api/admin/videos/[id]
// ============================================================
export const adminVideoUpdateSchema = z.object({
  title: z.string().optional(),
  channel: z.string().optional(),
  language: z.string().optional(),
  durationMin: z.number().optional(),
  publishedAt: z.union([z.string(), z.date()]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  hasCc: z.boolean().optional(),
  hasChapters: z.boolean().optional(),
  sourceNotes: z.string().nullable().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
  transcriptSummary: z.string().nullable().optional(),
  glossary: z.union([z.string(), z.array(z.any())]).nullable().optional(),
  deprecatedFlags: z.union([z.string(), z.array(z.any())]).nullable().optional(),
  difficulty: z.enum(["easy", "normal", "hard"]).optional(),
  hasSampleCode: z.boolean().optional(),
  likeRatio: z.number().min(0).max(1).optional(),
  isPublished: z.boolean().optional(),
});

export type AdminVideoUpdateInput = z.infer<typeof adminVideoUpdateSchema>;

// ============================================================
// POST /api/admin/videos/[id]/summarize
// ============================================================
export const summarizeSchema = z.object({
  transcript: z.string().min(1, "transcript is required"),
});

export type SummarizeInput = z.infer<typeof summarizeSchema>;

// ============================================================
// POST /api/admin/paths
// ============================================================
const pathStepSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  order: z.number({ error: "order is required" }),
  whyThis: z.string().min(1, "whyThis is required"),
  checkpointQuestion: z.string().min(1, "checkpointQuestion is required"),
});

export const pathCreateSchema = z.object({
  title: z.string().min(1, "title is required"),
  targetAudience: z.string().min(1, "targetAudience is required"),
  goal: z.string().min(1, "goal is required"),
  totalTimeEstimate: z.number({ error: "totalTimeEstimate is required" }),
  isPublished: z.boolean().optional(),
  steps: z.array(pathStepSchema).min(1, "At least one step is required"),
});

export type PathCreateInput = z.infer<typeof pathCreateSchema>;

// ============================================================
// PATCH /api/admin/paths/[id]
// ============================================================
export const pathUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  targetAudience: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  totalTimeEstimate: z.number().optional(),
  isPublished: z.boolean().optional(),
  steps: z.array(pathStepSchema).optional(),
});

export type PathUpdateInput = z.infer<typeof pathUpdateSchema>;

// ============================================================
// PATCH /api/admin/feedback/[id]
// ============================================================
export const feedbackResolveSchema = z.object({
  resolved: z.boolean({
    error: "resolved (boolean) is required",
  }),
});

export type FeedbackResolveInput = z.infer<typeof feedbackResolveSchema>;

// ============================================================
// PUT /api/admin/bci-weights
// ============================================================
export const bciWeightsSchema = z.object({
  shortDuration: z.number().min(0).max(30),
  hasCc: z.number().min(0).max(30),
  hasChapters: z.number().min(0).max(30),
  easyDifficulty: z.number().min(0).max(30),
  recentPublish: z.number().min(0).max(30),
  hasSampleCode: z.number().min(0).max(30),
  healthyLikeRatio: z.number().min(0).max(30),
});

export type BCIWeightsInput = z.infer<typeof bciWeightsSchema>;

// ============================================================
// PUT /api/admin/summarizer-settings
// ============================================================
export const summarizerSettingsSchema = z.object({
  activePlugin: z.string().min(1, "activePlugin is required"),
  pluginConfigs: z.record(z.string(), z.any()).optional(),
});

export type SummarizerSettingsInput = z.infer<typeof summarizerSettingsSchema>;

// ============================================================
// POST /api/admin/youtube-lookup
// ============================================================
export const youtubeLookupSchema = z.object({
  url: z.string().min(1, "URLを入力してください"),
});

export type YoutubeLookupInput = z.infer<typeof youtubeLookupSchema>;

// ============================================================
// GET /api/paths クエリパラメータ
// ============================================================
export const pathsQuerySchema = z.object({
  page: z.string().regex(/^-?\d+$/, "page must be a number").optional(),
  limit: z.string().regex(/^-?\d+$/, "limit must be a number").optional(),
});

export type PathsQueryInput = z.infer<typeof pathsQuerySchema>;

// ============================================================
// GET /api/progress クエリパラメータ
// ============================================================
export const progressQuerySchema = z.object({
  page: z.string().regex(/^-?\d+$/, "page must be a number").optional(),
  limit: z.string().regex(/^-?\d+$/, "limit must be a number").optional(),
});

export type ProgressQueryInput = z.infer<typeof progressQuerySchema>;

// ============================================================
// GET /api/videos クエリパラメータ
// ============================================================
export const videosQuerySchema = z.object({
  level: z.enum(["beginner", "intermediate"]).optional(),
  duration: z.string().max(20).optional(),
  language: z.string().max(10).optional(),
  tags: z.string().max(500).optional(),
  sort: z.enum(["bci", "newest", "popular", "recommended"]).optional(),
  q: z.string().max(200).optional(),
  page: z.string().regex(/^-?\d+$/, "page must be a number").optional(),
  limit: z.string().regex(/^-?\d+$/, "limit must be a number").optional(),
});

export type VideosQueryInput = z.infer<typeof videosQuerySchema>;
