import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import type { ImportResult } from "./types";

interface ImportPreviewProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  result: ImportResult | null;
  error: string | null;
  onImport: () => void;
}

export function ImportPreview({
  input,
  setInput,
  loading,
  result,
  error,
  onImport,
}: ImportPreviewProps) {
  return (
    <>
      {/* Format description */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="w-5 h-5 text-primary-600" />
          <h3 className="font-medium text-slate-700">入力フォーマット</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-2">
          <p className="font-medium">JSON形式:</p>
          <pre className="bg-white rounded p-3 text-xs overflow-x-auto border border-slate-200">
            {`[
  {
    "url": "https://youtube.com/watch?v=...",
    "title": "動画タイトル",
    "channel": "チャンネル名",
    "durationMin": 15,
    "publishedAt": "2024-01-01",
    "tags": ["Python", "入門"],
    "memo": "メモ",
    "rating": 4
  }
]`}
          </pre>
          <p className="font-medium mt-3">CSV形式:</p>
          <pre className="bg-white rounded p-3 text-xs overflow-x-auto border border-slate-200">
            {`url,title,channel,durationMin,publishedAt,tags,memo,rating
https://...,動画タイトル,チャンネル名,15,2024-01-01,Python;入門,メモ,4`}
          </pre>
        </div>
      </div>

      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          データ入力（JSONまたはCSV）
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder="JSONまたはCSVデータをペーストしてください..."
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Import button */}
      <button
        onClick={onImport}
        disabled={loading || !input.trim()}
        className={clsx(
          "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-colors",
          loading || !input.trim()
            ? "bg-slate-300 cursor-not-allowed"
            : "bg-primary-600 hover:bg-primary-700"
        )}
      >
        <Upload className="w-4 h-4" />
        {loading ? "インポート中..." : "インポート実行"}
      </button>

      {/* Result */}
      {result && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">インポート完了</p>
            <p className="mt-1">
              新規作成: {result.created}件 / 更新: {result.updated}件 / 合計:{" "}
              {result.total}件
              {result.skipped ? ` / スキップ: ${result.skipped}件` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">エラー</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
