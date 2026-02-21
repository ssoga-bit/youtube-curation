"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useImportForm } from "./hooks/useImportForm";
import { UrlInput } from "./import/UrlInput";
import { MetaPreview } from "./import/MetaPreview";
import { ImportPreview } from "./import/ImportPreview";

export function ImportForm() {
  const {
    input,
    setInput,
    loading,
    result,
    error,
    handleImport,
    quickUrl,
    setQuickUrl,
    quickLoading,
    quickMeta,
    quickError,
    quickAdding,
    quickResult,
    handleFetchMeta,
    handleQuickAdd,
  } = useImportForm();

  return (
    <div className="space-y-6">
      {/* Quick Add by URL */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <UrlInput
          quickUrl={quickUrl}
          setQuickUrl={setQuickUrl}
          quickLoading={quickLoading}
          onFetchMeta={handleFetchMeta}
        />

        {/* Quick Add preview card */}
        {quickMeta && (
          <MetaPreview
            meta={quickMeta}
            quickAdding={quickAdding}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {/* Quick Add result */}
        {quickResult && (
          <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">追加完了</p>
              <p className="mt-1">
                新規作成: {quickResult.created}件 / 更新: {quickResult.updated}
                件
              </p>
            </div>
          </div>
        )}

        {/* Quick Add error */}
        {quickError && (
          <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">エラー</p>
              <p className="mt-1">{quickError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-slate-200" />
        <span className="text-sm text-slate-400">または</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <ImportPreview
        input={input}
        setInput={setInput}
        loading={loading}
        result={result}
        error={error}
        onImport={handleImport}
      />
    </div>
  );
}
