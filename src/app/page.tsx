import Link from "next/link";
import { ArrowRight, Sparkles, Clock, Zap, Video } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { VideoCard } from "@/components/video/VideoCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [paths, shortVideos, newVideos] = await Promise.all([
    prisma.path.findMany({
      where: { isPublished: true },
      include: { _count: { select: { steps: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.video.findMany({
      where: { isPublished: true, durationMin: { lte: 10 } },
      orderBy: { beginnerComfortIndex: "desc" },
      take: 4,
    }),
    prisma.video.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
  ]);

  const parseTags = (tags: string) => {
    try { return JSON.parse(tags) as string[]; } catch { return []; }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">AI学習ナビ</h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            初心者が迷わず今見るべき動画に辿り着ける
          </p>
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            動画を探す
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Learning Paths */}
      {paths.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              おすすめ学習トラック
            </h2>
            <Link
              href="/paths"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              すべて見る <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <h3 className="font-semibold text-slate-800 mb-2">
                  {path.title}
                </h3>
                <p className="text-sm text-slate-500 mb-3">{path.goal}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    約{path.totalTimeEstimate}分
                  </span>
                  <span>{path._count.steps}本の動画</span>
                  <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                    {path.targetAudience}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Short Videos */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            15分以内で学べる
          </h2>
          <Link
            href="/videos?duration=short&sort=bci"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            もっと見る <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shortVideos.map((video) => (
            <VideoCard key={video.id} video={{ ...video, tags: parseTags(video.tags) }} />
          ))}
          {shortVideos.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Video} message="まだ動画がありません" />
            </div>
          )}
        </div>
      </section>

      {/* New Videos */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            新着動画
          </h2>
          <Link
            href="/videos?sort=newest"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            もっと見る <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newVideos.map((video) => (
            <VideoCard key={video.id} video={{ ...video, tags: parseTags(video.tags) }} />
          ))}
          {newVideos.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Video} message="まだ動画がありません" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
