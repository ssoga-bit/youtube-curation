import { memo } from "react";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { BCIBadge } from "./BCIBadge";
import { extractVideoId } from "@/lib/youtube";

interface VideoCardProps {
  video: {
    id: string;
    url?: string;
    title: string;
    channel: string;
    durationMin: number;
    tags: string[];
    beginnerComfortIndex: number;
    transcriptSummary?: string | null;
  };
}

export const VideoCard = memo(function VideoCard({ video }: VideoCardProps) {
  const tags = video.tags.slice(0, 3);
  const ytVideoId = video.url ? extractVideoId(video.url) : null;
  const thumbnailUrl = ytVideoId
    ? `https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`
    : null;

  return (
    <Link href={`/videos/${video.id}`} className="group block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-transform" />
          )}
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {video.durationMin}分
          </span>
        </div>

        <div className="p-3">
          {/* Title */}
          <h3 className="font-medium text-slate-800 text-sm leading-snug line-clamp-2 mb-1">
            {video.title}
          </h3>

          {/* Channel */}
          <p className="text-xs text-slate-500 mb-2">{video.channel}</p>

          {/* BCI + Duration */}
          <div className="flex items-center gap-2 mb-2">
            <BCIBadge score={video.beginnerComfortIndex} />
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {video.durationMin}分
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Summary snippet */}
          {video.transcriptSummary && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
              {video.transcriptSummary.slice(0, 60)}...
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});
