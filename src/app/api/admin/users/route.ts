import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminHandler } from "@/lib/admin-handler";
import { PAGINATION } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Returns users with their watched videos and total watch time.
 * Supports pagination via page/limit query parameters.
 */
export const GET = adminHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10))
  );

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        progress: {
          where: { watched: true },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                channel: true,
                durationMin: true,
                difficulty: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: PAGINATION.RECENT_WATCH_LIMIT,
        },
        _count: {
          select: {
            progress: { where: { watched: true } },
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  const result = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    watchedVideos: user.progress.map((p) => ({
      videoId: p.video.id,
      title: p.video.title,
      channel: p.video.channel,
      durationMin: p.video.durationMin,
      difficulty: p.video.difficulty,
      watchedAt: p.updatedAt,
    })),
    totalWatchMin: user.progress.reduce(
      (sum, p) => sum + p.video.durationMin,
      0
    ),
    watchedCount: user._count.progress,
  }));

  return NextResponse.json({
    users: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, "Failed to fetch users");
