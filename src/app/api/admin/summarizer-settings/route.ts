import { NextRequest, NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-handler";
import { getSummarizerConfig, saveSummarizerConfig } from "@/lib/plugins/settings";
import { getPlugin, getAllPlugins } from "@/lib/plugins/registry";
import type { SummarizerPluginConfig } from "@/lib/plugins/types";
import { summarizerSettingsSchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/summarizer-settings
 * Returns current config + list of available plugins with their schemas.
 */
export const GET = adminHandler(async () => {
  const config = await getSummarizerConfig();
  const plugins = getAllPlugins().map((p) => ({
    key: p.key,
    name: p.name,
    configSchema: p.configSchema,
  }));

  return NextResponse.json({ config, plugins });
}, "Failed to fetch summarizer settings");

/**
 * PUT /api/admin/summarizer-settings
 * Save plugin config. Body: SummarizerPluginConfig
 */
export const PUT = adminHandler(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(summarizerSettingsSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation error", details: validation.details },
      { status: 400 }
    );
  }

  if (!getPlugin(validation.data.activePlugin)) {
    return NextResponse.json(
      { error: `Unknown plugin: ${validation.data.activePlugin}` },
      { status: 400 }
    );
  }

  const config: SummarizerPluginConfig = {
    activePlugin: validation.data.activePlugin,
    pluginConfigs: (validation.data.pluginConfigs ?? {}) as Record<string, Record<string, string>>,
  };

  await saveSummarizerConfig(config);

  return NextResponse.json({ config });
}, "Failed to save summarizer settings");
