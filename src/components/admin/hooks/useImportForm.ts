import { useState } from "react";
import toast from "react-hot-toast";
import type { YouTubeVideoMeta, ImportResult } from "../import/types";
import { api } from "@/lib/api-client";

function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = values[i] || "";
      if (h === "tags") {
        obj[h] = val
          .split(";")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (h === "durationMin" || h === "rating") {
        obj[h] = Number(val) || 0;
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

export function useImportForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick Add state
  const [quickUrl, setQuickUrl] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMeta, setQuickMeta] = useState<YouTubeVideoMeta | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickAdding, setQuickAdding] = useState(false);
  const [quickResult, setQuickResult] = useState<ImportResult | null>(null);

  async function handleFetchMeta() {
    setQuickLoading(true);
    setQuickError(null);
    setQuickMeta(null);
    setQuickResult(null);

    try {
      const json = await api.post<{ meta: YouTubeVideoMeta }>("/api/admin/youtube-lookup", { url: quickUrl });
      setQuickMeta(json.meta);
      toast.success("メタデータを取得しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setQuickError(message);
      toast.error(message);
    } finally {
      setQuickLoading(false);
    }
  }

  async function handleQuickAdd() {
    if (!quickMeta) return;

    setQuickAdding(true);
    setQuickError(null);
    setQuickResult(null);

    try {
      const json = await api.post<ImportResult>("/api/import", [
        {
          url: quickUrl,
          title: quickMeta.title,
          channel: quickMeta.channel,
          durationMin: quickMeta.durationMin,
          publishedAt: quickMeta.publishedAt,
          language: quickMeta.language,
          tags: quickMeta.tags,
        },
      ]);
      setQuickResult(json);
      setQuickMeta(null);
      setQuickUrl("");
      toast.success("動画を追加しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setQuickError(message);
      toast.error(message);
    } finally {
      setQuickAdding(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let data: unknown;

      // Try JSON first
      try {
        data = JSON.parse(input);
      } catch {
        // Try CSV
        const parsed = parseCSV(input);
        if (parsed.length === 0) {
          throw new Error(
            "入力データを解析できません。JSONまたはCSV形式で入力してください。"
          );
        }
        data = parsed;
      }

      const json = await api.post<ImportResult>("/api/import", data);
      setResult(json);
      setInput("");
      toast.success(`インポート完了: ${json.created}件作成, ${json.updated}件更新`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return {
    // Bulk import state
    input,
    setInput,
    loading,
    result,
    error,
    handleImport,
    // Quick add state
    quickUrl,
    setQuickUrl,
    quickLoading,
    quickMeta,
    quickError,
    quickAdding,
    quickResult,
    handleFetchMeta,
    handleQuickAdd,
  };
}
