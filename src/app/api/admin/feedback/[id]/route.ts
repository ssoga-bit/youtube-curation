import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminHandler } from "@/lib/admin-handler";
import { feedbackResolveSchema, validateBody } from "@/lib/validations";

export const PATCH = adminHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = validateBody(feedbackResolveSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const { resolved } = validation.data;

  const feedback = await prisma.feedback.update({
    where: { id },
    data: { resolved },
  });

  return NextResponse.json({ feedback });
}, "Failed to update feedback");
