import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <FileQuestion className="w-12 h-12 text-slate-300 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        ページが見つかりませんでした
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        ホームに戻る
      </Link>
    </div>
  );
}
