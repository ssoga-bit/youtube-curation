"use client";

import { X, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

const DEFAULT_TAGS = [
  "python",
  "ai",
  "git",
  "html",
  "css",
  "javascript",
  "math",
  "data",
  "ml",
  "chatgpt",
];

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  level: string;
  onLevelChange: (v: string) => void;
  durations: string[];
  onDurationsChange: (v: string[]) => void;
  languages: string[];
  onLanguagesChange: (v: string[]) => void;
  selectedTags: string[];
  onTagsChange: (v: string[]) => void;
  availableTags?: string[];
}

export function FilterSidebar({
  isOpen,
  onClose,
  level,
  onLevelChange,
  durations,
  onDurationsChange,
  languages,
  onLanguagesChange,
  selectedTags,
  onTagsChange,
  availableTags,
}: FilterSidebarProps) {
  const tagOptions = availableTags && availableTags.length > 0 ? availableTags : DEFAULT_TAGS;
  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 overflow-y-auto transition-transform lg:static lg:translate-x-0 lg:z-0 lg:top-auto lg:bottom-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="font-semibold text-slate-800 flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" />
              フィルター
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Level */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">レベル</h3>
            <div className="space-y-1.5">
              {[
                { value: "", label: "すべて" },
                { value: "beginner", label: "超入門" },
                { value: "intermediate", label: "初級" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    value={opt.value}
                    checked={level === opt.value}
                    onChange={() => onLevelChange(opt.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">再生時間</h3>
            <div className="space-y-1.5">
              {[
                { value: "short", label: "10分以内" },
                { value: "medium", label: "10〜30分" },
                { value: "long", label: "30分以上" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={durations.includes(opt.value)}
                    onChange={() => onDurationsChange(toggleArrayItem(durations, opt.value))}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">言語</h3>
            <div className="space-y-1.5">
              {[
                { value: "ja", label: "日本語" },
                { value: "en", label: "English" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={languages.includes(opt.value)}
                    onChange={() => onLanguagesChange(toggleArrayItem(languages, opt.value))}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">テーマ</h3>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagsChange(toggleArrayItem(selectedTags, tag))}
                  className={clsx(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
