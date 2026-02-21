"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ExternalLink,
  Play,
  Clock,
  Globe,
  Calendar,
  Eye,
  Bookmark,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Home,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import clsx from "clsx";
import { BCIBadge } from "@/components/video/BCIBadge";
import { VideoCard } from "@/components/video/VideoCard";
import { FeedbackButton } from "@/components/video/FeedbackButton";
import { api } from "@/lib/api-client";

interface GlossaryItem {
  term: string;
  explain: string;
}

interface Video {
  id: string;
  url: string;
  title: string;
  channel: string;
  language: string;
  durationMin: number;
  publishedAt: string;
  tags: string[];
  hasCc: boolean;
  hasChapters: boolean;
  sourceNotes: string | null;
  qualityScore: number;
  beginnerComfortIndex: number;
  transcriptSummary: string | null;
  glossary: GlossaryItem[];
  deprecatedFlags: string[];
  prerequisites: string | null;
  learnings: string[] | null;
  difficulty: string;
  hasSampleCode: boolean;
  likeRatio: number;
  isPublished: boolean;
  relatedVideos?: Video[];
}

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watched, setWatched] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    api.get<{ video: Video; relatedVideos?: Video[] }>(`/api/videos/${id}`)
      .then((data) => {
        if (data?.video) {
          setVideo({ ...data.video, relatedVideos: data.relatedVideos || [] });
        } else {
          setVideo(null);
        }
      })
      .catch(() => setVideo(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Load existing progress for logged-in user
  useEffect(() => {
    if (!session?.user || !id) return;
    api.get<{ data?: { videoId: string; watched: boolean; bookmarked: boolean }[]; progress?: { videoId: string; watched: boolean; bookmarked: boolean }[] }>("/api/progress")
      .then((data) => {
        const entry = (data?.data || data?.progress)?.find(
          (p) => p.videoId === id
        );
        if (entry) {
          setWatched(entry.watched);
          setBookmarked(entry.bookmarked);
        }
      })
      .catch(() => {});
  }, [session, id]);

  function toggleProgress(field: "watched" | "bookmarked") {
    const next = field === "watched" ? !watched : !bookmarked;
    if (field === "watched") setWatched(next);
    else setBookmarked(next);

    api.post("/api/progress", { videoId: id, [field]: next }).catch(() => {
      // Revert on error
      if (field === "watched") setWatched(!next);
      else setBookmarked(!next);
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-10 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">動画が見つかりませんでした</p>
        <Link href="/videos" className="text-primary-600 hover:underline mt-2 inline-block">
          動画一覧に戻る
        </Link>
      </div>
    );
  }

  const publishedDate = new Date(video.publishedAt).toLocaleDateString("ja-JP");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          ホーム
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/videos" className="hover:text-slate-600">
          動画一覧
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 truncate max-w-[200px]">{video.title}</span>
      </nav>

      {/* Title & Channel */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
        {video.title}
      </h1>
      <p className="text-slate-500 mb-4">{video.channel}</p>

      {/* YouTube link + Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <Play className="w-4 h-4" />
          YouTubeで見る
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => toggleProgress("watched")}
          className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors",
            watched
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Eye className="w-4 h-4" />
          {watched ? "視聴済み" : "視聴済みにする"}
        </button>

        <button
          onClick={() => toggleProgress("bookmarked")}
          className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors",
            bookmarked
              ? "bg-yellow-50 border-yellow-300 text-yellow-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Bookmark className="w-4 h-4" />
          {bookmarked ? "ブックマーク済み" : "ブックマーク"}
        </button>

        <FeedbackButton videoId={id} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <BCIBadge score={video.beginnerComfortIndex} size="md" />
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          {video.durationMin}分
        </span>
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Globe className="w-4 h-4" />
          {video.language === "ja" ? "日本語" : "English"}
        </span>
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          {publishedDate}
        </span>
        {video.hasCc && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">字幕あり</span>
        )}
        {video.hasChapters && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">チャプターあり</span>
        )}
        {video.hasSampleCode && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">サンプルコードあり</span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {video.tags.map((tag) => (
          <Link
            key={tag}
            href={`/videos?tags=${tag}`}
            className="bg-primary-50 text-primary-700 text-sm px-2.5 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>

      {/* Summary */}
      {video.transcriptSummary && (
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            要点サマリ
          </h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
            {video.transcriptSummary}
          </p>
        </section>
      )}

      {/* Glossary */}
      {video.glossary && video.glossary.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            用語ミニ辞書
          </h2>
          <div className="divide-y divide-slate-100">
            {video.glossary.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <dt className="font-medium text-slate-800 text-sm">
                  {item.term}
                </dt>
                <dd className="text-sm text-slate-500 mt-0.5">
                  {item.explain}
                </dd>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prerequisites */}
      {video.prerequisites && video.prerequisites !== "不要" && (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            前提知識
          </h2>
          <p className="text-sm text-blue-700">{video.prerequisites}</p>
        </section>
      )}

      {/* Learnings */}
      {video.learnings && video.learnings.length > 0 && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            この動画で学べること
          </h2>
          <ul className="space-y-1.5">
            {video.learnings.map((item, i) => (
              <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Deprecated flags */}
      {video.deprecatedFlags && video.deprecatedFlags.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            つまずき注意
          </h2>
          <ul className="space-y-1.5">
            {video.deprecatedFlags.map((flag, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Videos */}
      {video.relatedVideos && video.relatedVideos.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            関連動画
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {video.relatedVideos.slice(0, 3).map((rv) => (
              <VideoCard key={rv.id} video={rv} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
