import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVideoJson } from "@/lib/parse";
import { adminHandler } from "@/lib/admin-handler";
import { pathUpdateSchema, validateBody } from "@/lib/validations";

export const GET = adminHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const path = await prisma.path.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: { video: true },
      },
    },
  });

  if (!path) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  return NextResponse.json({
    path: {
      ...path,
      stepCount: path.steps.length,
      steps: path.steps.map((s) => ({
        ...s,
        video: parseVideoJson(s.video as unknown as Record<string, unknown>),
      })),
    },
  });
}, "Failed to fetch path");

export const PATCH = adminHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = validateBody(pathUpdateSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const existing = await prisma.path.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  const { steps, ...fields } = validation.data;

  const data: Record<string, unknown> = {};
  if (fields.title !== undefined) data.title = fields.title;
  if (fields.targetAudience !== undefined) data.targetAudience = fields.targetAudience;
  if (fields.goal !== undefined) data.goal = fields.goal;
  if (fields.totalTimeEstimate !== undefined) data.totalTimeEstimate = Number(fields.totalTimeEstimate);
  if (fields.isPublished !== undefined) data.isPublished = fields.isPublished;

  if (Array.isArray(steps)) {
    // Full replacement: delete old steps, create new ones in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.pathStep.deleteMany({ where: { pathId: id } });

      await tx.path.update({
        where: { id },
        data,
      });

      for (const step of steps) {
        await tx.pathStep.create({
          data: {
            pathId: id,
            videoId: step.videoId,
            order: step.order,
            whyThis: step.whyThis,
            checkpointQuestion: step.checkpointQuestion,
          },
        });
      }

      return tx.path.findUnique({
        where: { id },
        include: {
          steps: {
            orderBy: { order: "asc" },
            include: { video: true },
          },
        },
      });
    });

    return NextResponse.json({
      path: updated
        ? {
            ...updated,
            stepCount: updated.steps.length,
            steps: updated.steps.map((s) => ({
              ...s,
              video: parseVideoJson(s.video as unknown as Record<string, unknown>),
            })),
          }
        : null,
    });
  }

  // No steps update, just update path fields
  const updated = await prisma.path.update({
    where: { id },
    data,
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: { video: true },
      },
    },
  });

  return NextResponse.json({
    path: {
      ...updated,
      stepCount: updated.steps.length,
      steps: updated.steps.map((s) => ({
        ...s,
        video: parseVideoJson(s.video as unknown as Record<string, unknown>),
      })),
    },
  });
}, "Failed to update path");

export const DELETE = adminHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.path.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  await prisma.path.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}, "Failed to delete path");
