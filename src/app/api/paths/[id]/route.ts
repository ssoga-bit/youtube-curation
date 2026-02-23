import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVideoJson } from "@/lib/parse";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const path = await prisma.path.findUnique({
      where: { id },
      include: {
        steps: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!path || !path.isPublished) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    const result = {
      ...path,
      steps: path.steps.map((step) => ({
        ...step,
        video: parseVideoJson(step.video as unknown as Record<string, unknown>),
      })),
    };

    return NextResponse.json({ path: result }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("GET /api/paths/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch path" },
      { status: 500 }
    );
  }
}
