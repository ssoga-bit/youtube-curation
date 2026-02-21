"use client";

import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        エラーが発生しました
      </h2>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
        {process.env.NODE_ENV === "production"
          ? "予期しないエラーが発生しました。もう一度お試しください。"
          : error.message || "予期しないエラーが発生しました。もう一度お試しください。"}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          もう一度試す
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
