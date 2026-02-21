export interface YouTubeVideoMeta {
  title: string;
  channel: string;
  durationMin: number;
  publishedAt: string;
  language: string;
  hasCc: boolean;
  hasChapters: boolean;
  tags: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped?: number;
  total: number;
}
