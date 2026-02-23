import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVideoId, fetchTranscript } from "@/lib/youtube";
import { adminHandler } from "@/lib/admin-handler";

export const dynamic = "force-dynamic";

export const GET = adminHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const videoId = extractVideoId(video.url as string);
  if (!videoId) {
    return NextResponse.json(
      { error: "YouTube動画IDを抽出できませんでした" },
      { status: 400 },
    );
  }

  const transcript = await fetchTranscript(videoId);
  if (!transcript) {
    return NextResponse.json(
      { error: "字幕を取得できませんでした。手動でテキストを入力してください。" },
      { status: 404 },
    );
  }

  return NextResponse.json({ transcript });
}, "Failed to fetch transcript");
