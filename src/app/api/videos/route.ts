import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseVideoJson } from "@/lib/parse";
import { PAGINATION, DURATION_THRESHOLDS } from "@/lib/constants";
import { videosQuerySchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // クエリパラメータのバリデーション
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });
    const queryValidation = validateBody(videosQuerySchema, queryObj);
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Validation error", details: queryValidation.details },
        { status: 400 }
      );
    }

    const level = searchParams.get("level");
    const duration = searchParams.get("duration");
    const language = searchParams.get("language");
    const tags = searchParams.get("tags");
    const sort = searchParams.get("sort") || "bci";
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10))
    );

    const andConditions: Prisma.VideoWhereInput[] = [{ isPublished: true }];

    // Filter by difficulty level
    if (level === "beginner") {
      andConditions.push({ difficulty: "easy" });
    } else if (level === "intermediate") {
      andConditions.push({ difficulty: { in: ["normal", "hard"] } });
    }

    // Filter by duration (supports comma-separated: "short,medium")
    if (duration) {
      const durationValues = duration.split(",").map((d) => d.trim());
      const durationConditions: Prisma.VideoWhereInput[] = [];
      for (const d of durationValues) {
        if (d === "short") durationConditions.push({ durationMin: { lte: DURATION_THRESHOLDS.SHORT } });
        else if (d === "medium") durationConditions.push({ durationMin: { gt: DURATION_THRESHOLDS.SHORT, lte: DURATION_THRESHOLDS.MEDIUM } });
        else if (d === "long") durationConditions.push({ durationMin: { gt: DURATION_THRESHOLDS.MEDIUM } });
      }
      if (durationConditions.length === 1) {
        andConditions.push(durationConditions[0]);
      } else if (durationConditions.length > 1) {
        andConditions.push({ OR: durationConditions });
      }
    }

    // Filter by language
    if (language) {
      andConditions.push({ language });
    }

    // Filter by tags (comma-separated, match all)
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      for (const tag of tagList) {
        andConditions.push({ tags: { contains: tag } });
      }
    }

    // Search by title or channel
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q } },
          { channel: { contains: q } },
        ],
      });
    }

    const where: Prisma.VideoWhereInput = { AND: andConditions };

    // Sort order
    let orderBy: Prisma.VideoOrderByWithRelationInput;
    switch (sort) {
      case "newest":
        orderBy = { publishedAt: "desc" };
        break;
      case "popular":
        orderBy = { likeRatio: "desc" };
        break;
      case "recommended":
        orderBy = { qualityScore: "desc" };
        break;
      case "bci":
      default:
        orderBy = { beginnerComfortIndex: "desc" };
        break;
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
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
  } catch (error) {
    console.error("GET /api/videos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
