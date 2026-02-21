import { Route } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PathCard } from "@/components/path/PathCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PathsPage() {
  const rawPaths = await prisma.path.findMany({
    where: { isPublished: true },
    include: { _count: { select: { steps: true } } },
    orderBy: { createdAt: "desc" },
  });

  const paths = rawPaths.map(({ _count, ...path }) => ({
    ...path,
    stepCount: _count.steps,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Route className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-slate-800">学習トラック</h1>
        </div>
        <p className="text-slate-500">
          目的に合わせた学習パスで、効率よくスキルアップしましょう。
        </p>
      </div>

      {/* Paths grid */}
      {paths.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((path) => (
            <PathCard key={path.id} {...path} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          message="学習トラックはまだありません"
          description="トラックが追加されるとここに表示されます。"
        />
      )}
    </div>
  );
}
