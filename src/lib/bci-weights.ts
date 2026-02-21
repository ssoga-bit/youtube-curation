import { prisma } from "@/lib/prisma";
import { BCIWeights, DEFAULT_BCI_WEIGHTS } from "@/lib/bci";

/**
 * Read BCI weights from DB (AppSetting key="bci-weights").
 * Returns DEFAULT_BCI_WEIGHTS if not found.
 */
export async function getBCIWeights(): Promise<BCIWeights> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "bci-weights" },
  });

  if (!setting) {
    return DEFAULT_BCI_WEIGHTS;
  }

  try {
    const parsed = JSON.parse(setting.value);
    return { ...DEFAULT_BCI_WEIGHTS, ...parsed };
  } catch {
    return DEFAULT_BCI_WEIGHTS;
  }
}
