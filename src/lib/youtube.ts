/**
 * YouTube Data API v3 integration utilities.
 */

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * Returns null if invalid.
 */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // https://www.youtube.com/watch?v=VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      return parsed.searchParams.get("v") || null;
    }

    // https://youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id || null;
    }

    // https://www.youtube.com/embed/VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {
      const id = parsed.pathname.replace("/embed/", "");
      return id || null;
    }

    return null;
  } catch {
    return null;
  }
}

export interface YouTubeVideoMeta {
  title: string;
  channel: string;
  durationMin: number;
  publishedAt: string; // ISO string
  language: string;
  hasCc: boolean;
  hasChapters: boolean; // Check description for timestamps like "0:00" or "00:00"
  tags: string[];
}

/**
 * Parse ISO 8601 duration (e.g. PT1H2M3S) to total minutes (rounded).
 */
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return Math.round(hours * 60 + minutes + seconds / 60);
}

/**
 * Check if a description contains chapter timestamps.
 * Looks for patterns like "0:00" or "00:00" at the start of lines.
 */
export function hasChapterTimestamps(description: string): boolean {
  // Match lines starting with a timestamp like 0:00, 00:00, 1:23:45, etc.
  const chapterPattern = /^(\d{1,2}:)?\d{1,2}:\d{2}\s/m;
  return chapterPattern.test(description);
}

/**
 * YouTube Data API v3 - fetch video metadata.
 * Uses env var YOUTUBE_API_KEY.
 * Returns null if video not found or API key not set.
 */
export async function fetchVideoMeta(
  videoId: string
): Promise<YouTubeVideoMeta | null> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.warn("YOUTUBE_API_KEY is not set");
    return null;
  }

  try {
    // Fetch video details (snippet + contentDetails)
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.error(
        "YouTube API video fetch error:",
        videoRes.status,
        await videoRes.text()
      );
      return null;
    }

    const videoData = await videoRes.json();
    if (!videoData.items || videoData.items.length === 0) {
      return null;
    }

    const item = videoData.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    // Parse duration
    const durationMin = parseISO8601Duration(contentDetails.duration || "PT0S");

    // Determine language
    const language =
      snippet.defaultLanguage ||
      snippet.defaultAudioLanguage ||
      "ja";

    // Check for chapter timestamps in description
    const hasChapters = hasChapterTimestamps(snippet.description || "");

    // Extract tags
    const tags: string[] = snippet.tags || [];

    // Check if captions are available
    let hasCc = false;
    try {
      const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
      const captionsRes = await fetch(captionsUrl);
      if (captionsRes.ok) {
        const captionsData = await captionsRes.json();
        hasCc =
          captionsData.items && captionsData.items.length > 0;
      }
    } catch (err) {
      console.warn("Failed to fetch captions info:", err);
    }

    return {
      title: snippet.title,
      channel: snippet.channelTitle,
      durationMin,
      publishedAt: snippet.publishedAt,
      language,
      hasCc,
      hasChapters,
      tags,
    };
  } catch (error) {
    console.error("fetchVideoMeta error:", error);
    return null;
  }
}
