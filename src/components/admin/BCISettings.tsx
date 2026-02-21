"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, SlidersHorizontal, RefreshCw } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

interface WeightConfig {
  key: string;
  label: string;
  defaultValue: number;
}

const WEIGHTS: WeightConfig[] = [
  { key: "shortDuration", label: "短い動画", defaultValue: 20 },
  { key: "hasCc", label: "字幕あり", defaultValue: 15 },
  { key: "hasChapters", label: "チャプターあり", defaultValue: 15 },
  { key: "easyDifficulty", label: "やさしい難易度", defaultValue: 20 },
  { key: "recentPublish", label: "最近の公開", defaultValue: 10 },
  { key: "hasSampleCode", label: "サンプルコードあり", defaultValue: 10 },
  { key: "healthyLikeRatio", label: "高評価率", defaultValue: 10 },
];

function getDefaults(): Record<string, number> {
  const obj: Record<string, number> = {};
  WEIGHTS.forEach((w) => {
    obj[w.key] = w.defaultValue;
  });
  return obj;
}

export function BCISettings() {
  const [weights, setWeights] = useState<Record<string, number>>(getDefaults());
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  useEffect(() => {
    api.get<Record<string, number>>("/api/admin/bci-weights")
      .then((data) => {
        setWeights({ ...getDefaults(), ...data });
      })
      .catch(() => {
        // use defaults
      })
      .finally(() => setLoading(false));
  }, []);

  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);

  function handleChange(key: string, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    try {
      await api.put("/api/admin/bci-weights", weights);
      setSaved(true);
      toast.success("BCI重み設定を保存しました");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("保存に失敗しました");
    }
  }

  function handleReset() {
    setWeights(getDefaults());
    setSaved(false);
  }

  async function handleRecalculate() {
    if (!confirm("全動画のBCIスコアを再計算しますか？")) return;
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const data = await api.post<{ updated: number; total: number }>("/api/admin/bci-recalculate");
      setRecalcResult(`${data.updated}/${data.total} 件の動画を更新しました`);
      toast.success(`${data.updated}/${data.total} 件のBCIスコアを再計算しました`);
      setTimeout(() => setRecalcResult(null), 5000);
    } catch {
      toast.error("再計算に失敗しました");
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-slate-600">
        <SlidersHorizontal className="w-5 h-5" />
        <p className="text-sm">
          各要素の重みを0〜30で設定します。合計値が大きいほどBCIスコアの上限が上がります。
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        {WEIGHTS.map((w) => (
          <div key={w.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                {w.label}
              </label>
              <span className="text-sm font-mono text-slate-500 tabular-nums">
                {weights[w.key]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={weights[w.key]}
              onChange={(e) => handleChange(w.key, Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>0</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          合計ウェイト
        </span>
        <span
          className={clsx(
            "text-lg font-bold tabular-nums",
            total <= 100 ? "text-primary-600" : "text-amber-600"
          )}
        >
          {total}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className={clsx(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-colors",
            saved
              ? "bg-green-500"
              : "bg-primary-600 hover:bg-primary-700"
          )}
        >
          <Save className="w-4 h-4" />
          {saved ? "保存しました" : "保存"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          デフォルトに戻す
        </button>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className={clsx(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors",
            recalculating
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          )}
        >
          <RefreshCw className={clsx("w-4 h-4", recalculating && "animate-spin")} />
          {recalculating ? "再計算中..." : "全動画のBCIを再計算"}
        </button>
      </div>

      {recalcResult && (
        <div className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">
          {recalcResult}
        </div>
      )}
    </div>
  );
}
