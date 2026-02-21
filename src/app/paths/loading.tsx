import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Loader2 className="w-12 h-12 text-primary-600 mb-4 animate-spin" />
      <p className="text-slate-500 text-sm">読み込み中...</p>
    </div>
  );
}
