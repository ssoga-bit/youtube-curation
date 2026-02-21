import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PAGINATION } from "@/lib/constants";
import { progressUpsertSchema, progressQuerySchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = request.nextUrl;

    // クエリパラメータのバリデーション
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });
    const queryValidation = validateBody(progressQuerySchema, queryObj);
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Validation error", details: queryValidation.details },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10))
    );

    const where = { userId };

    const [progress, total] = await Promise.all([
      prisma.userProgress.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              channel: true,
              durationMin: true,
              difficulty: true,
              beginnerComfortIndex: true,
              tags: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userProgress.count({ where }),
    ]);

    return NextResponse.json({
      data: progress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const validation = validateBody(progressUpsertSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.details },
        { status: 400 }
      );
    }

    const { videoId, watched, bookmarked } = validation.data;

    // Verify video exists
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const data: { watched?: boolean; bookmarked?: boolean } = {};
    if (typeof watched === "boolean") data.watched = watched;
    if (typeof bookmarked === "boolean") data.bookmarked = bookmarked;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_videoId: { userId, videoId },
      },
      update: data,
      create: {
        userId,
        videoId,
        watched: watched ?? false,
        bookmarked: bookmarked ?? false,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("POST /api/progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
