import { Plus, Pencil, Trash2, Route } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";
import type { Path } from "./types";

interface PathListProps {
  paths: Path[];
  onStartCreate: () => void;
  onStartEdit: (path: Path) => void;
  onDeleteRequest: (path: Path) => void;
}

export function PathList({
  paths,
  onStartCreate,
  onStartEdit,
  onDeleteRequest,
}: PathListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          トラック一覧（{paths.length}件）
        </h2>
        <button
          onClick={onStartCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          新しいトラックを作成
        </button>
      </div>

      {paths.length === 0 ? (
        <EmptyState icon={Route} message="トラックがまだありません。" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">
                  タイトル
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">
                  対象者
                </th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">
                  ステップ数
                </th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">
                  所要時間
                </th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">
                  状態
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {paths.map((path) => (
                <tr
                  key={path.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {path.title}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {path.targetAudience}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {path.stepCount}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {path.totalTimeEstimate}分
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={clsx(
                        "inline-block px-2 py-0.5 text-xs font-medium rounded-full",
                        path.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {path.isPublished ? "公開中" : "非公開"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onStartEdit(path)}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                        title="編集"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(path)}
                        className="p-1.5 rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
