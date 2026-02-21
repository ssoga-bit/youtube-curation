"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Loader2, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

const TYPE_LABELS: Record<string, string> = {
  difficult: "\u{1F635} \u96E3\u3057\u304B\u3063\u305F",
  error: "\u274C \u8AA4\u308A\u304C\u3042\u308B",
  broken_link: "\u{1F517} \u30EA\u30F3\u30AF\u5207\u308C",
  outdated: "\u{1F4C5} \u60C5\u5831\u304C\u53E4\u3044",
};

type Filter = "all" | "unresolved" | "resolved";

interface Feedback {
  id: string;
  videoId: string;
  type: string;
  comment: string | null;
  resolved: boolean;
  createdAt: string;
  video: { id: string; title: string; channel: string };
}

export function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("unresolved");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      const params = filter === "all" ? "" : `?resolved=${filter === "resolved"}`;
      const data = await api.get<{ feedbacks: Feedback[] }>(`/api/feedback${params}`);
      setFeedbacks(data.feedbacks || []);
    } catch (e) {
      console.error("Failed to fetch feedbacks:", e);
      toast.error("フィードバックの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function toggleResolved(id: string, currentResolved: boolean) {
    setTogglingId(id);
    try {
      await api.patch(`/api/admin/feedback/${id}`, { resolved: !currentResolved });
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, resolved: !currentResolved } : f
        )
      );
      toast.success(currentResolved ? "未解決に戻しました" : "解決済みにしました");
    } catch (e) {
      console.error("Failed to toggle feedback resolved status:", e);
      toast.error("ステータスの変更に失敗しました");
    } finally {
      setTogglingId(null);
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "\u3059\u3079\u3066" },
    { key: "unresolved", label: "\u672A\u89E3\u6C7A" },
    { key: "resolved", label: "\u89E3\u6C7A\u6E08\u307F" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === key
                ? "bg-primary-100 text-primary-700"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="ml-2 text-slate-500">{"\u8AAD\u307F\u8FBC\u307F\u4E2D..."}</span>
        </div>
      ) : feedbacks.length === 0 ? (
        <EmptyState icon={MessageSquare} message="フィードバックはありません" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 font-medium text-slate-500">{"\u52D5\u753B"}</th>
                <th className="pb-3 font-medium text-slate-500">{"\u7A2E\u985E"}</th>
                <th className="pb-3 font-medium text-slate-500">{"\u30B3\u30E1\u30F3\u30C8"}</th>
                <th className="pb-3 font-medium text-slate-500">{"\u65E5\u4ED8"}</th>
                <th className="pb-3 font-medium text-slate-500">{"\u30B9\u30C6\u30FC\u30BF\u30B9"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedbacks.map((fb) => (
                <tr key={fb.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 max-w-[200px]">
                    <p className="text-slate-800 truncate font-medium">
                      {fb.video.title}
                    </p>
                    <p className="text-slate-400 text-xs truncate">
                      {fb.video.channel}
                    </p>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {TYPE_LABELS[fb.type] || fb.type}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <p className="text-slate-600 truncate">
                      {fb.comment || "\u2014"}
                    </p>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-slate-500">
                    {new Date(fb.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleResolved(fb.id, fb.resolved)}
                      disabled={togglingId === fb.id}
                      aria-label={fb.resolved ? "未解決に戻す" : "解決済みにする"}
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                        fb.resolved
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {togglingId === fb.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : fb.resolved ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                      {fb.resolved ? "\u89E3\u6C7A\u6E08\u307F" : "\u672A\u89E3\u6C7A"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
