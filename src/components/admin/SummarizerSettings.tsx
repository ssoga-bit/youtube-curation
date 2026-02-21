"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

interface PluginConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  required: boolean;
  placeholder?: string;
}

interface PluginInfo {
  key: string;
  name: string;
  configSchema: PluginConfigField[];
}

interface SummarizerConfig {
  activePlugin: string;
  pluginConfigs: Record<string, Record<string, string>>;
}

export function SummarizerSettings() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [config, setConfig] = useState<SummarizerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ plugins: PluginInfo[]; config: SummarizerConfig }>("/api/admin/summarizer-settings")
      .then((data) => {
        setPlugins(data.plugins);
        setConfig(data.config);
      })
      .catch(() => {
        setError("設定の読み込みに失敗しました");
        toast.error("設定の読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await api.put("/api/admin/summarizer-settings", config);
      setSaved(true);
      toast.success("要約設定を保存しました");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "保存に失敗しました";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function updatePluginConfig(pluginKey: string, fieldKey: string, value: string) {
    if (!config) return;
    setConfig({
      ...config,
      pluginConfigs: {
        ...config.pluginConfigs,
        [pluginKey]: {
          ...(config.pluginConfigs[pluginKey] || {}),
          [fieldKey]: value,
        },
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        <span className="ml-2 text-slate-500">読み込み中...</span>
      </div>
    );
  }

  if (!config) {
    return <p className="text-red-500">{error || "設定を読み込めませんでした"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">要約プラグイン設定</h3>
        <p className="text-sm text-slate-500">
          動画要約に使用するプラグインを選択し、接続情報を設定します。
        </p>
      </div>

      {/* Plugin selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          アクティブなプラグイン
        </label>
        <div className="flex gap-3">
          {plugins.map((plugin) => (
            <button
              key={plugin.key}
              onClick={() => setConfig({ ...config, activePlugin: plugin.key })}
              className={clsx(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                config.activePlugin === plugin.key
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {plugin.name}
            </button>
          ))}
        </div>
      </div>

      {/* Config fields for each plugin */}
      {plugins.map((plugin) => (
        <div
          key={plugin.key}
          className={clsx(
            "border rounded-lg p-5 transition-opacity",
            config.activePlugin === plugin.key
              ? "border-primary-200 bg-primary-50/30"
              : "border-slate-100 bg-slate-50/50 opacity-60"
          )}
        >
          <h4 className="font-medium text-slate-700 mb-4">{plugin.name} 設定</h4>

          {plugin.configSchema.length === 0 ? (
            <p className="text-sm text-slate-500">
              環境変数から自動で設定されます（追加設定不要）
            </p>
          ) : (
            <div className="space-y-4">
              {plugin.configSchema.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={config.pluginConfigs[plugin.key]?.[field.key] || ""}
                    onChange={(e) =>
                      updatePluginConfig(plugin.key, field.key, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存
        </button>

        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            保存しました
          </span>
        )}

        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}
