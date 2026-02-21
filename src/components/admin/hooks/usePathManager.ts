import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type { Video, Path, PathFormData, StepForm } from "../path/types";
import { emptyForm } from "../path/types";
import { api } from "@/lib/api-client";

export function usePathManager() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PathFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Path | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPaths = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ paths: Path[] }>("/api/admin/paths");
      setPaths(data.paths || []);
    } catch (e) {
      console.error("Failed to fetch paths:", e);
      toast.error("トラック一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await api.get<{ videos: Video[] }>("/api/admin/videos?limit=100");
      setVideos(data.videos || []);
    } catch (e) {
      console.error("Failed to fetch videos:", e);
      toast.error("動画一覧の取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    fetchPaths();
    fetchVideos();
  }, [fetchPaths, fetchVideos]);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setMode("create");
  }

  function startEdit(path: Path) {
    setForm({
      title: path.title,
      targetAudience: path.targetAudience,
      goal: path.goal,
      totalTimeEstimate: path.totalTimeEstimate,
      isPublished: path.isPublished,
      steps: path.steps.map((s) => ({
        videoId: s.videoId,
        order: s.order,
        whyThis: s.whyThis,
        checkpointQuestion: s.checkpointQuestion,
      })),
    });
    setEditingId(path.id);
    setError(null);
    setMode("edit");
  }

  function cancelForm() {
    setMode("list");
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function addStep() {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          videoId: "",
          order: prev.steps.length + 1,
          whyThis: "",
          checkpointQuestion: "",
        },
      ],
    }));
  }

  function removeStep(index: number) {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 })),
    }));
  }

  function moveStep(index: number, direction: "up" | "down") {
    setForm((prev) => {
      const steps = [...prev.steps];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= steps.length) return prev;
      [steps[index], steps[swapIndex]] = [steps[swapIndex], steps[index]];
      return {
        ...prev,
        steps: steps.map((s, i) => ({ ...s, order: i + 1 })),
      };
    });
  }

  function updateStep(index: number, field: keyof StepForm, value: string | number) {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  }

  async function handleSave() {
    setError(null);

    if (!form.title.trim()) {
      setError("タイトルは必須です");
      return;
    }
    if (!form.targetAudience.trim()) {
      setError("対象者は必須です");
      return;
    }
    if (!form.goal.trim()) {
      setError("ゴールは必須です");
      return;
    }
    if (form.steps.length === 0) {
      setError("少なくとも1つのステップが必要です");
      return;
    }
    for (const step of form.steps) {
      if (!step.videoId) {
        setError("すべてのステップに動画を選択してください");
        return;
      }
      if (!step.whyThis.trim()) {
        setError("すべてのステップに「なぜこの動画？」を入力してください");
        return;
      }
      if (!step.checkpointQuestion.trim()) {
        setError("すべてのステップにチェックポイント質問を入力してください");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        totalTimeEstimate: Number(form.totalTimeEstimate),
      };

      if (mode === "create") {
        await api.post("/api/admin/paths", payload);
      } else {
        await api.patch(`/api/admin/paths/${editingId}`, payload);
      }

      await fetchPaths();
      cancelForm();
      toast.success(mode === "create" ? "トラックを作成しました" : "トラックを更新しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/paths/${deleteTarget.id}`);
      setPaths((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("トラックを削除しました");
    } catch (e) {
      console.error("Failed to delete path:", e);
      toast.error("トラックの削除に失敗しました");
    } finally {
      setDeleteTarget(null);
    }
  }

  return {
    // state
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
    // actions
    startCreate,
    startEdit,
    cancelForm,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    handleSave,
    handleDelete,
  };
}
