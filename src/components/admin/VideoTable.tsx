"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  X,
  Check,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";
import { SummarizeButton } from "@/components/admin/SummarizeButton";
import { BCIScoreBadge } from "@/components/video/BCIBadge";

interface Video {
  id: string;
  title: string;
  url: string;
  channel: string;
  beginnerComfortIndex: number;
  tags: string[];
  isPublished: boolean;
  difficulty: string;
  durationMin: number;
}

interface VideoTableProps {
  videos: Video[];
  onTogglePublish: (id: string, publish: boolean) => Promise<void>;
  onUpdate: (id: string, data: Partial<Video>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function VideoTable({
  videos,
  onTogglePublish,
  onUpdate,
  onDelete,
  onRefresh,
}: VideoTableProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      videos.filter(
        (v) =>
          v.title.toLowerCase().includes(search.toLowerCase()) ||
          v.channel.toLowerCase().includes(search.toLowerCase()) ||
          v.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      ),
    [videos, search]
  );

  function startEdit(video: Video) {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditTags(video.tags.join(", "));
  }

  async function saveEdit(id: string) {
    setLoading(id);
    await onUpdate(id, {
      title: editTitle,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditingId(null);
    setLoading(null);
  }

  async function handleDelete(id: string) {
    setLoading(id);
    await onDelete(id);
    setDeletingId(null);
    setLoading(null);
  }

  async function handleToggle(id: string, publish: boolean) {
    setLoading(id);
    await onTogglePublish(id, publish);
    setLoading(null);
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトル・チャンネル・タグで検索..."
          aria-label="タイトル・チャンネル・タグで検索"
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-3 font-medium text-slate-500">タイトル</th>
              <th className="pb-3 font-medium text-slate-500 hidden md:table-cell">
                チャンネル
              </th>
              <th className="pb-3 font-medium text-slate-500 text-center">
                BCI
              </th>
              <th className="pb-3 font-medium text-slate-500 hidden lg:table-cell">
                タグ
              </th>
              <th className="pb-3 font-medium text-slate-500 text-center">
                状態
              </th>
              <th className="pb-3 font-medium text-slate-500 text-center">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((video) => (
              <tr key={video.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4">
                  {editingId === video.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <span className="font-medium text-slate-800 line-clamp-1">
                      {video.title}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-slate-500 hidden md:table-cell">
                  {video.channel}
                </td>
                <td className="py-3 text-center">
                  <BCIScoreBadge score={video.beginnerComfortIndex} />
                </td>
                <td className="py-3 pr-4 hidden lg:table-cell">
                  {editingId === video.id ? (
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="タグ1, タグ2, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="text-xs text-slate-400">
                          +{video.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 text-center">
                  <span
                    className={clsx(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      video.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {video.isPublished ? "公開" : "非公開"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-center gap-1">
                    {editingId === video.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(video.id)}
                          disabled={loading === video.id}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="保存"
                          aria-label="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                          title="キャンセル"
                          aria-label="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : deletingId === video.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600 mr-1">削除？</span>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={loading === video.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="削除を確定"
                          aria-label="削除を確定"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                          title="キャンセル"
                          aria-label="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleToggle(video.id, !video.isPublished)
                          }
                          disabled={loading === video.id}
                          className={clsx(
                            "p-1.5 rounded",
                            video.isPublished
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-green-600 hover:bg-green-50"
                          )}
                          title={video.isPublished ? "非公開にする" : "公開する"}
                          aria-label={video.isPublished ? "非公開にする" : "公開する"}
                        >
                          {video.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(video)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                          title="編集"
                          aria-label="編集"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(video.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                          title="削除"
                          aria-label="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <SummarizeButton
                          videoId={video.id}
                          videoTitle={video.title}
                          videoUrl={video.url}
                          onSummarized={() => onRefresh?.()}
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={Video} message="該当する動画がありません" />
      )}
    </div>
  );
}
