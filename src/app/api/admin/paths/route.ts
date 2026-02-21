import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVideoJson } from "@/lib/parse";
import { adminHandler } from "@/lib/admin-handler";
import { pathCreateSchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = adminHandler(async () => {
  const paths = await prisma.path.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          video: true,
        },
      },
    },
  });

  const result = paths.map((p) => ({
    ...p,
    stepCount: p.steps.length,
    steps: p.steps.map((s) => ({
      ...s,
      video: parseVideoJson(s.video as unknown as Record<string, unknown>),
    })),
  }));

  return NextResponse.json({ paths: result });
}, "Failed to fetch paths");

export const POST = adminHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateBody(pathCreateSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const { title, targetAudience, goal, totalTimeEstimate, isPublished, steps } = validation.data;

  const path = await prisma.path.create({
    data: {
      title,
      targetAudience,
      goal,
      totalTimeEstimate: Number(totalTimeEstimate),
      isPublished: isPublished ?? true,
      steps: {
        create: steps.map((s: { videoId: string; order: number; whyThis: string; checkpointQuestion: string }) => ({
          videoId: s.videoId,
          order: s.order,
          whyThis: s.whyThis,
          checkpointQuestion: s.checkpointQuestion,
        })),
      },
    },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: { video: true },
      },
    },
  });

  return NextResponse.json({
    path: {
      ...path,
      stepCount: path.steps.length,
      steps: path.steps.map((s) => ({
        ...s,
        video: parseVideoJson(s.video as unknown as Record<string, unknown>),
      })),
    },
  }, { status: 201 });
}, "Failed to create path");
