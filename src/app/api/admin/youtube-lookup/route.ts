import { NextRequest, NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-handler";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube";
import { youtubeLookupSchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

// POST { url: string }
// Returns { meta: YouTubeVideoMeta } or { error: string }
export const POST = adminHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateBody(youtubeLookupSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const { url } = validation.data;

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "有効なYouTube URLを入力してください" },
      { status: 400 }
    );
  }

  const meta = await fetchVideoMeta(videoId);
  if (!meta) {
    return NextResponse.json(
      { error: "動画のメタデータを取得できませんでした。APIキーを確認してください。" },
      { status: 404 }
    );
  }

  return NextResponse.json({ meta });
}, "Failed to lookup YouTube video");
