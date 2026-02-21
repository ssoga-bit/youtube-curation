"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronUp, Clock, Film, User } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

interface WatchedVideo {
  videoId: string;
  title: string;
  channel: string;
  durationMin: number;
  difficulty: string;
  watchedAt: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  watchedVideos: WatchedVideo[];
  totalWatchMin: number;
  watchedCount: number;
}

function formatMin(min: number) {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

function difficultyLabel(d: string) {
  if (d === "easy") return "入門";
  if (d === "hard") return "上級";
  return "中級";
}

export function UserManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ users: UserData[] }>("/api/admin/users")
      .then((data) => setUsers(data.users || []))
      .catch(() => {
        toast.error("ユーザー情報の取得に失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        <span className="ml-2 text-slate-500">読み込み中...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-slate-500 text-center py-8">ユーザーがいません</p>;
  }

  // admin以外を先に、視聴数降順
  const sorted = [...users].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return 1;
    if (a.role !== "admin" && b.role === "admin") return -1;
    return b.watchedCount - a.watchedCount;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">ユーザー閲覧状況</h3>
        <span className="text-sm text-slate-500">{users.length}名</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-700">
            {users.filter((u) => u.role !== "admin").length}
          </p>
          <p className="text-xs text-primary-600">一般ユーザー</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {users.reduce((s, u) => s + u.watchedCount, 0)}
          </p>
          <p className="text-xs text-emerald-600">総視聴動画数</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {formatMin(users.reduce((s, u) => s + u.totalWatchMin, 0))}
          </p>
          <p className="text-xs text-amber-600">総視聴時間</p>
        </div>
      </div>

      {/* User list */}
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
        {sorted.map((user) => {
          const isOpen = expandedId === user.id;
          return (
            <div key={user.id}>
              {/* User row */}
              <button
                onClick={() => setExpandedId(isOpen ? null : user.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 truncate">
                      {user.name || user.email}
                    </span>
                    {user.role === "admin" && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                        管理者
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Film className="w-3.5 h-3.5" />
                    {user.watchedCount}本
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    {formatMin(user.totalWatchMin)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded: watched videos */}
              {isOpen && (
                <div className="bg-slate-50 px-4 pb-3">
                  {user.watchedVideos.length === 0 ? (
                    <p className="text-sm text-slate-400 py-3 text-center">
                      視聴済み動画なし
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-200">
                          <th className="text-left py-2 font-medium">タイトル</th>
                          <th className="text-left py-2 font-medium w-28">チャンネル</th>
                          <th className="text-center py-2 font-medium w-16">難易度</th>
                          <th className="text-right py-2 font-medium w-16">時間</th>
                          <th className="text-right py-2 font-medium w-24">視聴日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.watchedVideos.map((v) => (
                          <tr
                            key={v.videoId}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-2 text-slate-700 truncate max-w-[300px]">
                              {v.title}
                            </td>
                            <td className="py-2 text-slate-500 truncate">
                              {v.channel}
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={clsx(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  v.difficulty === "easy" &&
                                    "bg-green-100 text-green-700",
                                  v.difficulty === "normal" &&
                                    "bg-yellow-100 text-yellow-700",
                                  v.difficulty === "hard" &&
                                    "bg-red-100 text-red-700"
                                )}
                              >
                                {difficultyLabel(v.difficulty)}
                              </span>
                            </td>
                            <td className="py-2 text-right text-slate-500">
                              {v.durationMin}分
                            </td>
                            <td className="py-2 text-right text-slate-400">
                              {new Date(v.watchedAt).toLocaleDateString("ja-JP")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
