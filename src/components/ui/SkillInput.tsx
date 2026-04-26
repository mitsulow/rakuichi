"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";

interface SkillInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxCount?: number;
  /** Suggestion chips shown below the input. */
  suggestions?: string[];
  /** Tag color theme: "accent" (default 朱) or "indigo". */
  variant?: "accent" | "indigo";
}

const DEFAULT_SUGGESTED = [
  "パソコン",
  "ピアノ",
  "料理",
  "HTML",
  "デザイン",
  "営業",
  "経理",
  "翻訳",
  "写真",
  "動画編集",
  "整体",
  "ヨガ",
  "農業",
  "陶芸",
  "DTP",
  "イラスト",
  "縫物",
  "編み物",
  "DIY",
  "農業指導",
  "猟",
  "釣り",
  "発酵",
  "薬草",
  "アロマ",
  "ハーブ",
  "瞑想",
  "ボディワーク",
  "占い",
  "ホロスコープ",
  "音楽",
  "歌",
  "ダンス",
  "ギター",
  "三味線",
  "和太鼓",
  "書道",
  "茶道",
  "華道",
  "保育",
  "助産",
  "看護",
  "鍼灸",
  "気功",
  "整骨",
];

/**
 * Cell-by-cell tag input. Each entry is a discrete "drop into the box"
 * action — type, hit Enter (or tap the ＋), and the new tag pops into the
 * row. Comma is treated as a literal character so phrases like "野菜、お米"
 * stay as one tag. Built around the joy of watching the row fill up.
 */
export function SkillInput({
  value,
  onChange,
  placeholder = "1個目を入れてみよう",
  maxCount = 100,
  suggestions = DEFAULT_SUGGESTED,
  variant = "accent",
}: SkillInputProps) {
  const [draft, setDraft] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!recentlyAdded) return;
    const t = setTimeout(() => setRecentlyAdded(null), 700);
    return () => clearTimeout(t);
  }, [recentlyAdded]);

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (value.length >= maxCount) return;
    if (value.some((v) => v.toLowerCase() === s.toLowerCase())) return;
    onChange([...value, s]);
    setDraft("");
    setRecentlyAdded(s);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const themeColor = variant === "indigo" ? "#2b3a67" : "#c94d3a";
  const tagBg = variant === "indigo" ? "#2b3a6715" : "#c94d3a15";

  const filteredSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Counter row */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-bold leading-none transition-colors"
          style={{ color: themeColor }}
        >
          {value.length}
        </span>
        <span className="text-xs text-text-mute">個</span>
        <span className="text-[10px] text-text-mute ml-1">
          / {maxCount}
        </span>
        {value.length === 0 && (
          <span
            className="text-[10px] ml-auto animate-pulse font-medium"
            style={{ color: themeColor }}
          >
            ↓ Enter で 1 個ずつ追加
          </span>
        )}
      </div>

      {/* Tag row — only shown when there are tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-bg/40 border border-dashed border-border rounded-xl min-h-[44px]">
          {value.map((skill, i) => {
            const isFresh = skill === recentlyAdded;
            return (
              <span
                key={`${skill}-${i}`}
                className={`group inline-flex items-center gap-1 rounded-full pl-3 pr-1 py-1 text-xs font-medium ${
                  isFresh ? "ring-2 scale-110" : ""
                }`}
                style={{
                  background: tagBg,
                  color: themeColor,
                  ...(isFresh && {
                    animation: "tag-pop 0.55s cubic-bezier(.34,1.56,.64,1)",
                    boxShadow: `0 0 0 2px ${themeColor}40`,
                  }),
                }}
              >
                <span
                  className="text-[9px] font-bold opacity-50 mr-0.5"
                  style={{ color: themeColor }}
                >
                  {i + 1}
                </span>
                {skill}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-60 group-hover:opacity-100"
                  aria-label="削除"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Big input box with ＋ button */}
      {value.length < maxCount && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => draft && addSkill(draft)}
            placeholder={
              value.length === 0
                ? placeholder
                : `${value.length + 1}個目を入れる`
            }
            className="w-full bg-card border-2 border-border rounded-xl pl-4 pr-12 py-3 text-base font-medium focus:outline-none transition-colors"
            style={{
              borderColor: draft ? themeColor : undefined,
            }}
            maxLength={40}
          />
          <button
            type="button"
            onClick={() => addSkill(draft)}
            disabled={!draft.trim()}
            aria-label="追加"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white text-base font-bold flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: draft.trim() ? themeColor : "#cccccc",
              transform: draft.trim()
                ? "translateY(-50%) scale(1)"
                : "translateY(-50%) scale(0.85)",
              transition: "all 0.15s",
            }}
          >
            ＋
          </button>
        </div>
      )}

      {/* Suggestions — tap to drop one cell into the row */}
      {value.length < maxCount && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          <span className="text-[10px] text-text-mute py-0.5">候補：</span>
          {filteredSuggestions.slice(0, 16).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="text-[10px] text-text-mute border border-border rounded-full px-2 py-0.5 transition-colors"
              style={{
                ["--hover-color" as string]: themeColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = themeColor;
                e.currentTarget.style.borderColor = themeColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "";
                e.currentTarget.style.borderColor = "";
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes tag-pop {
          0% {
            opacity: 0;
            transform: translateY(-12px) scale(0.5);
          }
          50% {
            transform: translateY(0) scale(1.18);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
