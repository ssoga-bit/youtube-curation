import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/lib/constants";
import { pathsQuerySchema, validateBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // クエリパラメータのバリデーション
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });
    const queryValidation = validateBody(pathsQuerySchema, queryObj);
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

    const where = { isPublished: true };

    const [paths, total] = await Promise.all([
      prisma.path.findMany({
        where,
        include: {
          _count: { select: { steps: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.path.count({ where }),
    ]);

    const result = paths.map(({ _count, ...path }) => ({
      ...path,
      stepCount: _count.steps,
    }));

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/paths error:", error);
    return NextResponse.json(
      { error: "Failed to fetch paths" },
      { status: 500 }
    );
  }
}
