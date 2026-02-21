import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BCI_WEIGHTS, BCIWeights } from "@/lib/bci";
import { adminHandler } from "@/lib/admin-handler";
import { bciWeightsSchema, validateBody } from "@/lib/validations";

export const GET = adminHandler(async () => {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "bci-weights" },
  });

  if (!setting) {
    return NextResponse.json(DEFAULT_BCI_WEIGHTS);
  }

  const weights = { ...DEFAULT_BCI_WEIGHTS, ...JSON.parse(setting.value) };
  return NextResponse.json(weights);
}, "Failed to read BCI weights");

export const PUT = adminHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateBody(bciWeightsSchema, body);

  if (!validation.success) {
    // 既存テストとの互換性: "Missing weight key: ..." や "Invalid value for ..." メッセージ形式を維持
    const firstError = validation.details[0];
    const fieldName = firstError?.path?.[0];
    if (fieldName && !(String(fieldName) in body)) {
      return NextResponse.json(
        { error: `Missing weight key: ${String(fieldName)}` },
        { status: 400 }
      );
    }
    if (fieldName) {
      return NextResponse.json(
        { error: `Invalid value for ${String(fieldName)}: must be a number 0-30` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  const weights: BCIWeights = validation.data as BCIWeights;

  await prisma.appSetting.upsert({
    where: { key: "bci-weights" },
    update: { value: JSON.stringify(weights) },
    create: { key: "bci-weights", value: JSON.stringify(weights) },
  });

  return NextResponse.json(weights);
}, "Failed to save BCI weights");
