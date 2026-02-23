"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  Lightbulb,
  PartyPopper,
} from "lucide-react";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { getBCILabel } from "@/lib/bci";
import { BCI_LABEL_THRESHOLDS } from "@/lib/constants";
import type { VideoMinimal } from "@/types/video";

interface Step {
  id: string;
  order: number;
  whyThis: string | null;
  checkpointQuestion: string | null;
  video: VideoMinimal;
}

interface StepTimelineProps {
  pathId: string;
  steps: Step[];
}

export function StepTimeline({ pathId, steps }: StepTimelineProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [celebrating, setCelebrating] = useState(false);
  const { data: session, status } = useSession();

  // Load progress on mount
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Authenticated: fetch progress from API
      api.get<{ data?: { videoId: string; watched: boolean }[]; progress?: { videoId: string; watched: boolean }[] }>("/api/progress")
        .then((data) => {
          const watchedVideoIds = new Set(
            (data.data || data.progress || [])
              .filter((p) => p.watched)
              .map((p) => p.videoId)
          );
          // Map video IDs back to step IDs
          const completedSteps = new Set<string>();
          for (const step of steps) {
            if (watchedVideoIds.has(step.video.id)) {
              completedSteps.add(step.id);
            }
          }
          setCompleted(completedSteps);
        })
        .catch(() => {
          // Fallback to localStorage on error
          loadFromLocalStorage();
        });
    } else {
      // Unauthenticated: use localStorage
      loadFromLocalStorage();
    }
  }, [pathId, status, session]);

  function loadFromLocalStorage() {
    const stored = localStorage.getItem(`path-progress-${pathId}`);
    if (stored) {
      try {
        setCompleted(new Set(JSON.parse(stored)));
      } catch {
        // ignore invalid data
      }
    }
  }

  function toggleStep(stepId: string, videoId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
        // If logged in, mark as unwatched via API
        if (session?.user) {
          // Fire-and-forget: localStorage にも保存しているため API 失敗は非致命的
          api.post("/api/progress", { videoId, watched: false }).catch(() => {});
        }
      } else {
        next.add(stepId);
        // Mark video as watched
        if (session?.user) {
          // Fire-and-forget: localStorage にも保存しているため API 失敗は非致命的
          api.post("/api/progress", { videoId, watched: true }).catch(() => {});
        }
      }

      // Always save to localStorage as fallback
      localStorage.setItem(
        `path-progress-${pathId}`,
        JSON.stringify(Array.from(next))
      );

      if (next.size === steps.length && !celebrating) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 5000);
      }

      return next;
    });
  }

  const allDone = completed.size === steps.length && steps.length > 0;

  return (
    <div className="space-y-0">
      {/* Celebration */}
      {(allDone || celebrating) && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6 text-center">
          <PartyPopper className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-yellow-800">
            トラック完了！
          </h3>
          <p className="text-yellow-700 text-sm mt-1">
            おめでとうございます！すべてのステップを完了しました。
          </p>
        </div>
      )}

      {/* Steps */}
      {steps.map((step, index) => {
        const isDone = completed.has(step.id);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Timeline line + circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => toggleStep(step.id, step.video.id)}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isDone
                    ? "bg-green-500 text-white"
                    : "bg-white border-2 border-slate-300 text-slate-500 hover:border-primary-400"
                )}
                title={isDone ? "完了済み" : "完了にする"}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{step.order}</span>
                )}
              </button>
              {!isLast && (
                <div
                  className={clsx(
                    "w-0.5 flex-1 min-h-[2rem]",
                    isDone ? "bg-green-300" : "bg-slate-200"
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className={clsx("pb-8 flex-1", isLast && "pb-0")}>
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/videos/${step.video.id}`}
                    className={clsx(
                      "font-medium hover:text-primary-600 transition-colors",
                      isDone && "line-through text-slate-400"
                    )}
                  >
                    {step.video.title}
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {step.video.durationMin}分
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-medium px-2 py-1 rounded",
                      step.video.beginnerComfortIndex >= BCI_LABEL_THRESHOLDS.EXCELLENT
                        ? "bg-green-100 text-green-800"
                        : step.video.beginnerComfortIndex >= BCI_LABEL_THRESHOLDS.GOOD
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {getBCILabel(step.video.beginnerComfortIndex).label || `BCI ${step.video.beginnerComfortIndex}`}
                  </span>
                </div>

                {step.whyThis && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600 bg-blue-50 rounded-md p-3">
                    <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-blue-700">
                        なぜこの動画？
                      </span>
                      <p className="mt-0.5">{step.whyThis}</p>
                    </div>
                  </div>
                )}

                {step.checkpointQuestion && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md p-3">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-amber-700">
                        チェックポイント
                      </span>
                      <p className="mt-0.5 text-amber-900">
                        {step.checkpointQuestion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
