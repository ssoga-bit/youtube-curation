"use client";

import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

interface LLMSummaryResult {
  transcriptSummary: string;
  glossary: { term: string; explain: string }[];
  difficulty: "easy" | "normal" | "hard";
  deprecatedFlags: string[];
  prerequisites: string;
  learnings: string[];
}

interface SummarizeButtonProps {
  videoId: string;
  videoTitle: string;
  videoUrl?: string;
  onSummarized?: () => void;
}

export function SummarizeButton({
  videoId,
  videoTitle,
  videoUrl,
  onSummarized,
}: SummarizeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [result, setResult] = useState<LLMSummaryResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setIsOpen(true);
    setTranscript("");
    setResult(null);
    setSaved(false);
    setError(null);
  }

  function handleClose() {
    setIsOpen(false);
    setTranscript("");
    setResult(null);
    setSaved(false);
    setError(null);
  }

  async function fetchTranscriptFromApi(): Promise<string | null> {
    try {
      const data = await api.get<{ transcript: string }>(
        `/api/admin/videos/${videoId}/transcript`,
      );
      return data.transcript;
    } catch {
      return null;
    }
  }

  async function handleOneClick() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await fetchTranscriptFromApi();
      if (!text) {
        setError("字幕を取得できませんでした。手動でテキストを入力してください。");
        toast.error("字幕を取得できませんでした");
        setLoading(false);
        return;
      }

      setTranscript(text);

      const data = await api.post<{ llmResult: LLMSummaryResult }>(
        `/api/admin/videos/${videoId}/summarize`,
        { transcript: text },
      );
      setResult(data.llmResult);
      setSaved(true);
      onSummarized?.();
      toast.success("ワンクリック要約が完了しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchTranscript() {
    setFetchingTranscript(true);
    setError(null);

    try {
      const text = await fetchTranscriptFromApi();
      if (text) {
        setTranscript(text);
        toast.success("字幕を取得しました");
      } else {
        setError("字幕を取得できませんでした。手動でテキストを入力してください。");
        toast.error("字幕を取得できませんでした");
      }
    } catch {
      setError("字幕の取得に失敗しました");
      toast.error("字幕の取得に失敗しました");
    } finally {
      setFetchingTranscript(false);
    }
  }

  async function handleGenerate() {
    if (!transcript.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.post<{ llmResult: LLMSummaryResult }>(
        `/api/admin/videos/${videoId}/summarize`,
        { transcript: transcript.trim() },
      );
      setResult(data.llmResult);
      setSaved(true);
      onSummarized?.();
      toast.success("AI要約を生成・保存しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const difficultyLabel: Record<string, string> = {
    easy: "初級",
    normal: "中級",
    hard: "上級",
  };

  const difficultyColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    normal: "bg-blue-100 text-blue-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-1.5 text-purple-500 hover:bg-purple-50 rounded"
        title="AI要約"
        aria-label="AI要約"
      >
        <Sparkles className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleClose();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="AI要約生成"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  AI要約生成
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">対象動画</p>
                <p className="text-sm font-medium text-slate-800 line-clamp-2">
                  {videoTitle}
                </p>
              </div>

              {/* One-click & fetch transcript buttons */}
              {videoUrl && !result && (
                <div className="flex gap-2">
                  <button
                    onClick={handleOneClick}
                    disabled={loading || fetchingTranscript}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      loading || fetchingTranscript
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        ワンクリック要約
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleFetchTranscript}
                    disabled={loading || fetchingTranscript}
                    className={clsx(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                      loading || fetchingTranscript
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
                    )}
                  >
                    {fetchingTranscript ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        取得中...
                      </>
                    ) : (
                      "字幕だけ取得"
                    )}
                  </button>
                </div>
              )}

              {/* Transcript input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  転写テキスト
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="動画の転写テキストを貼り付けてください..."
                  rows={8}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Generate button */}
              {!result && (
                <button
                  onClick={handleGenerate}
                  disabled={loading || !transcript.trim()}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    loading || !transcript.trim()
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成開始
                    </>
                  )}
                </button>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Result preview */}
              {result && (
                <div className="space-y-3 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-700">
                    生成結果
                  </h4>

                  {/* Summary */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      要約
                    </p>
                    <p className="text-sm text-slate-800">
                      {result.transcriptSummary}
                    </p>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      難易度
                    </p>
                    <span
                      className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        difficultyColor[result.difficulty] ||
                          "bg-slate-100 text-slate-600"
                      )}
                    >
                      {difficultyLabel[result.difficulty] || result.difficulty}
                    </span>
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      前提知識
                    </p>
                    <p className="text-sm text-slate-800">
                      {result.prerequisites}
                    </p>
                  </div>

                  {/* Learnings */}
                  {result.learnings.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        得られること
                      </p>
                      <ul className="list-disc list-inside text-sm text-slate-800 space-y-0.5">
                        {result.learnings.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Glossary */}
                  {result.glossary.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        用語辞書 ({result.glossary.length}語)
                      </p>
                      <div className="space-y-1">
                        {result.glossary.map((g, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-slate-800">
                              {g.term}
                            </span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-slate-600">{g.explain}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deprecated flags */}
                  {result.deprecatedFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        つまずき注意点
                      </p>
                      <ul className="list-disc list-inside text-sm text-amber-700 space-y-0.5">
                        {result.deprecatedFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Saved indicator */}
                  {saved && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 text-center">
                        保存完了しました
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
