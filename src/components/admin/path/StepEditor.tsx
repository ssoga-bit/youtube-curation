import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ListVideo,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";
import type { Video, StepForm } from "./types";

interface StepEditorProps {
  steps: StepForm[];
  videos: Video[];
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onMoveStep: (index: number, direction: "up" | "down") => void;
  onUpdateStep: (index: number, field: keyof StepForm, value: string | number) => void;
}

export function StepEditor({
  steps,
  videos,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onUpdateStep,
}: StepEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">ステップ</h3>
        <button
          onClick={onAddStep}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          ステップを追加
        </button>
      </div>

      {steps.length === 0 && (
        <EmptyState
          icon={ListVideo}
          message="ステップがありません。"
          description="「ステップを追加」をクリックして追加してください。"
        />
      )}

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-600">
                  ステップ {step.order}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMoveStep(index, "up")}
                  disabled={index === 0}
                  aria-label="上に移動"
                  className={clsx(
                    "p-1 rounded",
                    index === 0
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onMoveStep(index, "down")}
                  disabled={index === steps.length - 1}
                  aria-label="下に移動"
                  className={clsx(
                    "p-1 rounded",
                    index === steps.length - 1
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemoveStep(index)}
                  aria-label="ステップを削除"
                  className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  動画
                </label>
                <select
                  value={step.videoId}
                  onChange={(e) =>
                    onUpdateStep(index, "videoId", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">動画を選択...</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.channel} / {v.durationMin}分)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  なぜこの動画？
                </label>
                <input
                  type="text"
                  value={step.whyThis}
                  onChange={(e) =>
                    onUpdateStep(index, "whyThis", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="この動画を選んだ理由"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  チェックポイント質問
                </label>
                <input
                  type="text"
                  value={step.checkpointQuestion}
                  onChange={(e) =>
                    onUpdateStep(index, "checkpointQuestion", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="理解度チェックの質問"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
