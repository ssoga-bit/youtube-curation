import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  Target,
  BookOpen,
} from "lucide-react";
import { StepTimeline } from "@/components/path/StepTimeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const path = await prisma.path.findUnique({
    where: { id },
    include: {
      steps: {
        include: { video: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!path || !path.isPublished) notFound();

  const totalDuration = path.steps.reduce(
    (sum, s) => sum + (s.video?.durationMin || 0),
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/paths"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        学習トラック一覧
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          {path.title}
        </h1>

        <div className="flex flex-wrap gap-3 mb-4">
          {path.targetAudience && (
            <span className="inline-flex items-center gap-1 text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
              <Users className="w-3.5 h-3.5" />
              {path.targetAudience}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            約{path.totalTimeEstimate || totalDuration}分
          </span>
          <span className="inline-flex items-center gap-1 text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            {path.steps.length}ステップ
          </span>
        </div>

        {path.goal && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Target className="w-4 h-4 mt-0.5 shrink-0 text-primary-500" />
            <p>{path.goal}</p>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">
          学習ステップ
        </h2>
        <StepTimeline
          pathId={path.id}
          steps={path.steps.map((step) => ({
            ...step,
            video: {
              id: step.video.id,
              title: step.video.title,
              durationMin: step.video.durationMin,
              beginnerComfortIndex: step.video.beginnerComfortIndex,
            },
          }))}
        />
      </div>
    </div>
  );
}
