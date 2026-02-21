import { memo } from "react";
import Link from "next/link";
import { Clock, Users, Target, PlayCircle } from "lucide-react";

interface PathCardProps {
  id: string;
  title: string;
  targetAudience: string | null;
  goal: string | null;
  totalTimeEstimate: number | null;
  stepCount: number;
}

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-red-500",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

export const PathCard = memo(function PathCard({
  id,
  title,
  targetAudience,
  goal,
  totalTimeEstimate,
  stepCount,
}: PathCardProps) {
  const gradient = gradients[id.charCodeAt(0) % gradients.length];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4`}>
        <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
        {targetAudience && (
          <span className="inline-block mt-2 bg-white/20 text-white text-xs font-medium px-2.5 py-0.5 rounded-full backdrop-blur-sm">
            <Users className="w-3 h-3 inline mr-1" />
            {targetAudience}
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {goal && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Target className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
            <p>{goal}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-slate-500">
          {totalTimeEstimate != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              約{totalTimeEstimate}分
            </span>
          )}
          <span className="flex items-center gap-1">
            <PlayCircle className="w-4 h-4" />
            {stepCount}本の動画
          </span>
        </div>

        <Link
          href={`/paths/${id}`}
          className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          トラックを始める
        </Link>
      </div>
    </div>
  );
});
