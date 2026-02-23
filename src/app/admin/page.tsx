"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Film,
  Upload,
  SlidersHorizontal,
  MessageSquare,
  Route,
  LayoutDashboard,
  Loader2,
  Users,
} from "lucide-react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import type { VideoAdminItem } from "@/types/video";

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
    </div>
  );
}

const VideoTable = dynamic(
  () => import("@/components/admin/VideoTable").then(m => ({ default: m.VideoTable })),
  { loading: () => <TabLoader /> }
);
const ImportForm = dynamic(
  () => import("@/components/admin/ImportForm").then(m => ({ default: m.ImportForm })),
  { loading: () => <TabLoader /> }
);
const BCISettings = dynamic(
  () => import("@/components/admin/BCISettings").then(m => ({ default: m.BCISettings })),
  { loading: () => <TabLoader /> }
);
const FeedbackList = dynamic(
  () => import("@/components/admin/FeedbackList").then(m => ({ default: m.FeedbackList })),
  { loading: () => <TabLoader /> }
);
const PathManager = dynamic(
  () => import("@/components/admin/PathManager").then(m => ({ default: m.PathManager })),
  { loading: () => <TabLoader /> }
);
const UserManager = dynamic(
  () => import("@/components/admin/UserManager").then(m => ({ default: m.UserManager })),
  { loading: () => <TabLoader /> }
);

type Tab = "videos" | "import" | "bci" | "feedback" | "paths" | "users";

const TABS: { key: Tab; label: string; icon: typeof Film }[] = [
  { key: "videos", label: "動画管理", icon: Film },
  { key: "import", label: "インポート", icon: Upload },
  { key: "bci", label: "BCI設定", icon: SlidersHorizontal },
  { key: "feedback", label: "フィードバック", icon: MessageSquare },
  { key: "paths", label: "トラック管理", icon: Route },
  { key: "users", label: "ユーザー", icon: Users },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("videos");
  const [videos, setVideos] = useState<VideoAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ videos: VideoAdminItem[] }>("/api/admin/videos?limit=100");
      setVideos(data.videos || []);
    } catch (e) {
      console.error("Failed to fetch videos:", e);
      toast.error("動画一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && session.user?.role === "admin") {
      fetchVideos();
    }
  }, [fetchVideos, session]);

  const handleTogglePublish = useCallback(async (id: string, publish: boolean) => {
    try {
      await api.patch(`/api/admin/videos/${id}`, { isPublished: publish });
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isPublished: publish } : v))
      );
      toast.success(publish ? "動画を公開しました" : "動画を非公開にしました");
    } catch (e) {
      console.error("Failed to toggle publish:", e);
      toast.error("公開状態の変更に失敗しました");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/videos/${id}`);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("動画を削除しました");
    } catch (e) {
      console.error("Failed to delete video:", e);
      toast.error("動画の削除に失敗しました");
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, data: Partial<VideoAdminItem>) => {
    try {
      const json = await api.patch<{ video: VideoAdminItem }>(`/api/admin/videos/${id}`, data);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...json.video } : v))
      );
      toast.success("動画情報を更新しました");
    } catch (e) {
      console.error("Failed to update video:", e);
      toast.error("動画情報の更新に失敗しました");
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="ml-3 text-slate-500">読み込み中...</span>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-700 mb-2">アクセス権限がありません</h2>
        <p className="text-slate-500">このページは管理者のみアクセスできます。</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-800">管理ダッシュボード</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div
          className="flex gap-0 -mb-px"
          role="tablist"
          aria-label="管理ダッシュボード タブ"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const currentIndex = TABS.findIndex((t) => t.key === tab);
              const nextIndex =
                e.key === "ArrowRight"
                  ? (currentIndex + 1) % TABS.length
                  : (currentIndex - 1 + TABS.length) % TABS.length;
              const nextTab = TABS[nextIndex].key;
              setTab(nextTab);
              if (nextTab === "videos") fetchVideos();
              tabRefs.current[nextIndex]?.focus();
            }
          }}
        >
          {TABS.map(({ key, label, icon: Icon }, index) => (
            <button
              key={key}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={tab === key}
              aria-controls={`tabpanel-${key}`}
              id={`tab-${key}`}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => {
                setTab(key);
                if (key === "videos") fetchVideos();
              }}
              className={clsx(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        className="bg-white rounded-lg shadow-sm border border-slate-100 p-6"
        role="tabpanel"
        id={`tabpanel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "videos" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                <span className="ml-2 text-slate-500">読み込み中...</span>
              </div>
            ) : (
              <VideoTable
                videos={videos}
                onTogglePublish={handleTogglePublish}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onRefresh={fetchVideos}
              />
            )}
          </>
        )}

        {tab === "import" && <ImportForm />}

        {tab === "bci" && <BCISettings />}

        {tab === "feedback" && <FeedbackList />}

        {tab === "paths" && <PathManager />}

        {tab === "users" && <UserManager />}
      </div>
    </div>
  );
}
