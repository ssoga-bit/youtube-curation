"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Check } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

const FEEDBACK_TYPES = [
  { value: "difficult", emoji: "\u{1F635}", label: "\u96E3\u3057\u304B\u3063\u305F" },
  { value: "error", emoji: "\u274C", label: "\u8AA4\u308A\u304C\u3042\u308B" },
  { value: "broken_link", emoji: "\u{1F517}", label: "\u30EA\u30F3\u30AF\u5207\u308C" },
  { value: "outdated", emoji: "\u{1F4C5}", label: "\u60C5\u5831\u304C\u53E4\u3044" },
] as const;

interface FeedbackButtonProps {
  videoId: string;
}

export function FeedbackButton({ videoId }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleSubmit() {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      await api.post("/api/feedback", {
        videoId,
        type: selectedType,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      toast.success("フィードバックを送信しました。ありがとうございます！");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setSelectedType(null);
        setComment("");
      }, 1500);
    } catch (e) {
      console.error("Failed to submit feedback:", e);
      toast.error("フィードバックの送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="この動画にフィードバック"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        {"\u3053\u306E\u52D5\u753B\u306B\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF"}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="フィードバック送信"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        >
          {submitted ? (
            <div className="flex flex-col items-center py-4 text-green-600">
              <Check className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">{"\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01"}</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700 mb-3">
                {"\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u7A2E\u985E"}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {FEEDBACK_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    onClick={() => setSelectedType(ft.value)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                      selectedType === ft.value
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{ft.emoji}</span>
                    <span>{ft.label}</span>
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={"\u30B3\u30E1\u30F3\u30C8\uFF08\u4EFB\u610F\uFF09"}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3 resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!selectedType || submitting}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedType && !submitting
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {"\u9001\u4FE1"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
