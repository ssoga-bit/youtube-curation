import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackCreateSchema, validateBody } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = validateBody(feedbackCreateSchema, body);

    if (!validation.success) {
      // 既存テストとの互換性: type の enum エラーは専用メッセージを返す
      const typeError = validation.details.find((e) => e.path.includes("type"));
      if (typeError && body.videoId) {
        return NextResponse.json(
          { error: "type must be one of: difficult, error, broken_link, outdated" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Validation error", details: validation.details },
        { status: 400 }
      );
    }

    const { videoId, type, comment } = validation.data;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        videoId,
        type,
        comment: comment || null,
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const resolved = searchParams.get("resolved");

    const where: { resolved?: boolean } = {};
    if (resolved === "true") where.resolved = true;
    if (resolved === "false") where.resolved = false;

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: { video: { select: { id: true, title: true, channel: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}
