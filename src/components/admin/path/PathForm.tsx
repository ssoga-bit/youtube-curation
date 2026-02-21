import { X, Loader2, Save } from "lucide-react";
import { StepEditor } from "./StepEditor";
import type { Video, PathFormData, StepForm } from "./types";

interface PathFormProps {
  mode: "create" | "edit";
  form: PathFormData;
  setForm: React.Dispatch<React.SetStateAction<PathFormData>>;
  videos: Video[];
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onMoveStep: (index: number, direction: "up" | "down") => void;
  onUpdateStep: (index: number, field: keyof StepForm, value: string | number) => void;
}

export function PathForm({
  mode,
  form,
  setForm,
  videos,
  saving,
  error,
  onCancel,
  onSave,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onUpdateStep,
}: PathFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {mode === "create" ? "新しいトラックを作成" : "トラックを編集"}
        </h2>
        <button
          onClick={onCancel}
          aria-label="キャンセル"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
          キャンセル
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            タイトル
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="例: Python入門コース"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            対象者
          </label>
          <input
            type="text"
            value={form.targetAudience}
            onChange={(e) =>
              setForm((f) => ({ ...f, targetAudience: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="例: プログラミング完全初心者"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          ゴール
        </label>
        <textarea
          value={form.goal}
          onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="このトラックを完了した時に達成できるゴール"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            合計所要時間（分）
          </label>
          <input
            type="number"
            value={form.totalTimeEstimate}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                totalTimeEstimate: parseInt(e.target.value) || 0,
              }))
            }
            min={0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((f) => ({ ...f, isPublished: e.target.checked }))
              }
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">公開する</span>
          </label>
        </div>
      </div>

      {/* Steps editor */}
      <StepEditor
        steps={form.steps}
        videos={videos}
        onAddStep={onAddStep}
        onRemoveStep={onRemoveStep}
        onMoveStep={onMoveStep}
        onUpdateStep={onUpdateStep}
      />

      {/* Save / Cancel buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
