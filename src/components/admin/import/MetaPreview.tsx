import { Plus, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { YouTubeVideoMeta } from "./types";

interface MetaPreviewProps {
  meta: YouTubeVideoMeta;
  quickAdding: boolean;
  onQuickAdd: () => void;
}

export function MetaPreview({ meta, quickAdding, onQuickAdd }: MetaPreviewProps) {
  return (
    <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h4 className="font-medium text-slate-800 text-sm">
            {meta.title}
          </h4>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>チャンネル: {meta.channel}</span>
          <span>時間: {meta.durationMin}分</span>
          <span>言語: {meta.language}</span>
          <span>
            公開日:{" "}
            {new Date(meta.publishedAt).toLocaleDateString("ja-JP")}
          </span>
          <span>字幕: {meta.hasCc ? "あり" : "なし"}</span>
          <span>
            チャプター: {meta.hasChapters ? "あり" : "なし"}
          </span>
        </div>
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meta.tags.slice(0, 10).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
            {meta.tags.length > 10 && (
              <span className="px-2 py-0.5 text-xs text-slate-400">
                +{meta.tags.length - 10}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onQuickAdd}
        disabled={quickAdding}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors text-sm",
          quickAdding
            ? "bg-slate-300 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        )}
      >
        {quickAdding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {quickAdding ? "追加中..." : "追加"}
      </button>
    </div>
  );
}
