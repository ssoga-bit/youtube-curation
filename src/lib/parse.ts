/**
 * Parse JSON string fields in a Video record from the database.
 * tags, glossary, and deprecatedFlags are stored as JSON strings.
 */
export function parseVideoJson(video: Record<string, unknown>) {
  function safeParse(value: unknown, fallback: unknown = null) {
    if (!value || typeof value !== "string") return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return {
    ...video,
    tags: safeParse(video.tags, []),
    glossary: video.glossary ? safeParse(video.glossary, null) : null,
    deprecatedFlags: video.deprecatedFlags
      ? safeParse(video.deprecatedFlags, null)
      : null,
    learnings: video.learnings ? safeParse(video.learnings, null) : null,
  };
}
