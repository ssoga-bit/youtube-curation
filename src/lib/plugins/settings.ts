import { prisma } from "@/lib/prisma";
import type { SummarizerPluginConfig } from "./types";

const SETTING_KEY = "summarizer-plugin";

const DEFAULT_CONFIG: SummarizerPluginConfig = {
  activePlugin: "dify",
  pluginConfigs: {},
};

/**
 * Read summarizer plugin settings from DB (AppSetting key="summarizer-plugin").
 * Returns default config if not found.
 */
export async function getSummarizerConfig(): Promise<SummarizerPluginConfig> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (!setting) {
    return DEFAULT_CONFIG;
  }

  try {
    const parsed = JSON.parse(setting.value);
    return {
      activePlugin: parsed.activePlugin || DEFAULT_CONFIG.activePlugin,
      pluginConfigs: parsed.pluginConfigs || {},
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save summarizer plugin settings to DB.
 */
export async function saveSummarizerConfig(
  config: SummarizerPluginConfig
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(config) },
    create: { key: SETTING_KEY, value: JSON.stringify(config) },
  });
}
