"use client";

import { Loader2 } from "lucide-react";
import { usePathManager } from "./hooks/usePathManager";
import { PathList } from "./path/PathList";
import { PathForm } from "./path/PathForm";

export function PathManager() {
  const {
    paths,
    videos,
    loading,
    saving,
    mode,
    form,
    setForm,
    deleteTarget,
    setDeleteTarget,
    error,
    startCreate,
    startEdit,
    cancelForm,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    handleSave,
    handleDelete,
  } = usePathManager();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        <span className="ml-2 text-slate-500">読み込み中...</span>
      </div>
    );
  }

  // --- Form view ---
  if (mode === "create" || mode === "edit") {
    return (
      <PathForm
        mode={mode}
        form={form}
        setForm={setForm}
        videos={videos}
        saving={saving}
        error={error}
        onCancel={cancelForm}
        onSave={handleSave}
        onAddStep={addStep}
        onRemoveStep={removeStep}
        onMoveStep={moveStep}
        onUpdateStep={updateStep}
      />
    );
  }

  // --- List view ---
  return (
    <div>
      <PathList
        paths={paths}
        onStartCreate={startCreate}
        onStartEdit={startEdit}
        onDeleteRequest={setDeleteTarget}
      />

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              トラックを削除しますか？
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              「{deleteTarget.title}」を削除すると、すべてのステップも削除されます。この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
