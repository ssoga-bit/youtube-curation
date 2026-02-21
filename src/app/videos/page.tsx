"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronDown, Video } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { VideoCard } from "@/components/video/VideoCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { PAGINATION } from "@/lib/constants";
import { api } from "@/lib/api-client";

interface Video {
  id: string;
  title: string;
  channel: string;
  durationMin: number;
  tags: string[];
  beginnerComfortIndex: number;
  transcriptSummary: string | null;
}

const SORT_OPTIONS = [
  { value: "bci", label: "BCI順" },
  { value: "newest", label: "新しい順" },
  { value: "popular", label: "人気順" },
  { value: "recommended", label: "おすすめ順" },
];

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500">読み込み中...</div>}>
      <VideosContent />
    </Suspense>
  );
}

function VideosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read from URL params
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [durations, setDurations] = useState<string[]>(
    searchParams.get("duration")?.split(",").filter(Boolean) || []
  );
  const [languages, setLanguages] = useState<string[]>(
    searchParams.get("language")?.split(",").filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "bci");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  const [videos, setVideos] = useState<Video[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const limit = PAGINATION.VIDEOS_PER_PAGE;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Build URL params and sync
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (durations.length) params.set("duration", durations.join(","));
    if (languages.length) params.set("language", languages.join(","));
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (sort !== "bci") params.set("sort", sort);
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (page > 1) params.set("page", String(page));
    return params;
  }, [level, durations, languages, selectedTags, sort, debouncedQuery, page]);

  // Fetch videos
  useEffect(() => {
    const params = buildParams();
    params.set("limit", String(limit));

    // Sync URL
    const url = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/videos${url}`, { scroll: false });

    setIsLoading(true);
    api.get<{ videos: Video[]; pagination?: { total: number } }>(`/api/videos?${params.toString()}`)
      .then((data) => {
        setVideos(data.videos || []);
        setTotalCount(data.pagination?.total || 0);
      })
      .catch(() => {
        setVideos([]);
        setTotalCount(0);
      })
      .finally(() => setIsLoading(false));
  }, [level, durations, languages, selectedTags, sort, debouncedQuery, page, buildParams, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [level, durations, languages, selectedTags, sort, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <SlidersHorizontal className="w-4 h-4" />
          フィルター
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="キーワードで検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <FilterSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          level={level}
          onLevelChange={setLevel}
          durations={durations}
          onDurationsChange={setDurations}
          languages={languages}
          onLanguagesChange={setLanguages}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />

        {/* Video grid */}
        <div className="flex-1">
          {/* Results count */}
          <p className="text-sm text-slate-500 mb-4">
            {isLoading ? "読み込み中..." : `${totalCount}件の動画`}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm animate-pulse"
                >
                  <div className="aspect-video bg-slate-200 rounded-t-lg" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Video}
              message="条件に合う動画が見つかりませんでした"
              description="フィルターを変更してみてください"
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                前へ
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
