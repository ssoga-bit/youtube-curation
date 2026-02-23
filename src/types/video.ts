export interface GlossaryItem {
  term: string;
  explain: string;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  channel: string;
  language: string;
  durationMin: number;
  publishedAt: string;
  tags: string[];
  hasCc: boolean;
  hasChapters: boolean;
  sourceNotes: string | null;
  qualityScore: number;
  beginnerComfortIndex: number;
  transcriptSummary: string | null;
  glossary: GlossaryItem[];
  deprecatedFlags: string[];
  prerequisites: string | null;
  learnings: string[] | null;
  difficulty: string;
  hasSampleCode: boolean;
  likeRatio: number;
  isPublished: boolean;
  relatedVideos?: Video[];
}

/** Video list page / VideoCard */
export type VideoListItem = Pick<
  Video,
  "id" | "url" | "title" | "channel" | "durationMin" | "tags" | "beginnerComfortIndex" | "transcriptSummary"
>;

/** Admin dashboard / VideoTable */
export type VideoAdminItem = Pick<
  Video,
  "id" | "title" | "url" | "channel" | "beginnerComfortIndex" | "tags" | "isPublished" | "difficulty" | "durationMin"
>;

/** StepTimeline minimal video info */
export type VideoMinimal = Pick<
  Video,
  "id" | "title" | "durationMin" | "beginnerComfortIndex"
>;

/** Path step video info */
export type VideoPathItem = Pick<
  Video,
  "id" | "title" | "channel" | "durationMin"
>;
