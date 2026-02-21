import { Youtube, Search, Loader2 } from "lucide-react";
import clsx from "clsx";

interface UrlInputProps {
  quickUrl: string;
  setQuickUrl: (url: string) => void;
  quickLoading: boolean;
  onFetchMeta: () => void;
}

export function UrlInput({
  quickUrl,
  setQuickUrl,
  quickLoading,
  onFetchMeta,
}: UrlInputProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Youtube className="w-5 h-5 text-red-600" />
        <h3 className="font-medium text-slate-700">URL簡単追加</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={quickUrl}
          onChange={(e) => setQuickUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-label="YouTube動画URL"
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          onClick={onFetchMeta}
          disabled={quickLoading || !quickUrl.trim()}
          aria-label="メタデータ取得"
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-colors whitespace-nowrap",
            quickLoading || !quickUrl.trim()
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700"
          )}
        >
          {quickLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {quickLoading ? "取得中..." : "メタデータ取得"}
        </button>
      </div>
    </div>
  );
}
