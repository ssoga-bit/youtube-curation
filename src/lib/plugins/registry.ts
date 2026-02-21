import type { SummarizerPlugin } from "./types";
import { claudePlugin } from "./claude";
import { difyPlugin } from "./dify";

const plugins: Record<string, SummarizerPlugin> = {
  [claudePlugin.key]: claudePlugin,
  [difyPlugin.key]: difyPlugin,
};

export function getPlugin(key: string): SummarizerPlugin | undefined {
  return plugins[key];
}

export function getAllPlugins(): SummarizerPlugin[] {
  return Object.values(plugins);
}
