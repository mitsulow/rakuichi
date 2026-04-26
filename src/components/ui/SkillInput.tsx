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
 * Tag-style input that fills cells one-by-one. Press Enter (NOT comma) to
 * commit a tag — typing "野菜、お米" will keep the comma in the tag instead
 * of splitting, because adding things one-by-one is part of the UX.
 * The latest-added tag briefly pops with a scale animation.
 */
export function SkillInput({
  value,
  onChange,
  placeholder = "1個ずつ入れていこう",
  maxCount = 100,
  suggestions = DEFAULT_SUGGESTED,
  variant = "accent",
}: SkillInputProps) {
  const [draft, setDraft] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear the recent-add highlight after the pop animation finishes
  useEffect(() => {
    if (!recentlyAdded) return;
    const t = setTimeout(() => setRecentlyAdded(null), 600);
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
    // Re-focus the input so the user can keep typing the next one
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

  const tagColors =
    variant === "indigo"
      ? {
          bg: "bg-[#2b3a67]/15",
          text: "text-[#2b3a67]",
          ring: "ring-[#2b3a67]/40",
        }
      : {
          bg: "bg-accent/15",
          text: "text-accent",
          ring: "ring-accent/40",
        };

  const filteredSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-2 bg-bg border border-border rounded-xl min-h-[56px] focus-within:border-accent transition-colors">
        {value.map((skill, i) => {
          const isFresh = skill === recentlyAdded;
          return (
            <span
              key={`${skill}-${i}`}
              className={`inline-flex items-center gap-1 ${tagColors.bg} ${tagColors.text} rounded-full pl-3 pr-1.5 py-1 text-xs font-medium transition-transform ${
                isFresh ? `ring-2 ${tagColors.ring} scale-110` : ""
              }`}
              style={{
                animation: isFresh ? "tag-pop 0.4s ease-out" : undefined,
              }}
            >
              {skill}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                aria-label="削除"
              >
                ✕
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addSkill(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none px-1"
          maxLength={40}
        />
      </div>

      {/* Suggestions — tap to drop one cell into the row */}
      {value.length < maxCount && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-text-mute py-0.5">候補：</span>
          {filteredSuggestions.slice(0, 16).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="text-[10px] text-text-mute hover:text-accent hover:bg-accent/5 border border-border hover:border-accent rounded-full px-2 py-0.5 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-mute">
        Enter で追加・✕で削除（{value.length}/{maxCount}）
      </p>

      <style jsx>{`
        @keyframes tag-pop {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          60% {
            transform: scale(1.18);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
