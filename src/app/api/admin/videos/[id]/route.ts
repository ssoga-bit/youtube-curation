import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBCI } from "@/lib/bci";
import { getBCIWeights } from "@/lib/bci-weights";
import { parseVideoJson } from "@/lib/parse";
import { adminHandler } from "@/lib/admin-handler";
import { adminVideoUpdateSchema, validateBody } from "@/lib/validations";

export const PATCH = adminHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = validateBody(adminVideoUpdateSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...validation.data };

  // Convert array fields to JSON strings if provided as arrays
  if (Array.isArray(data.tags)) {
    data.tags = JSON.stringify(data.tags);
  }
  if (Array.isArray(data.glossary)) {
    data.glossary = JSON.stringify(data.glossary);
  }
  if (Array.isArray(data.deprecatedFlags)) {
    data.deprecatedFlags = JSON.stringify(data.deprecatedFlags);
  }

  // Recalculate BCI if relevant fields changed
  const merged = { ...existing, ...data };
  const weights = await getBCIWeights();
  const bci = calculateBCI(
    {
      durationMin: merged.durationMin as number,
      hasCc: merged.hasCc as boolean,
      hasChapters: merged.hasChapters as boolean,
      difficulty: merged.difficulty as "easy" | "normal" | "hard",
      publishedAt: new Date(merged.publishedAt as string | Date),
      hasSampleCode: merged.hasSampleCode as boolean,
      likeRatio: merged.likeRatio as number,
    },
    weights
  );
  data.beginnerComfortIndex = bci;

  const updated = await prisma.video.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    video: parseVideoJson(updated as unknown as Record<string, unknown>),
  });
}, "Failed to update video");

export const DELETE = adminHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await prisma.video.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}, "Failed to delete video");
