import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseVideoJson } from "@/lib/parse";
import { adminHandler } from "@/lib/admin-handler";
import { PAGINATION } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const GET = adminHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.ADMIN_VIDEOS_DEFAULT_LIMIT), 10))
  );
  const q = searchParams.get("q");

  const where: Prisma.VideoWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { channel: { contains: q } },
    ];
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => parseVideoJson(v as unknown as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, "Failed to fetch videos");
