"use client";

import { useState, KeyboardEvent } from "react";

interface SkillInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxCount?: number;
}

const SUGGESTED = [
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
];

/**
 * Tag-style multi-text input. Type a skill and press Enter or comma to add.
 */
export function SkillInput({
  value,
  onChange,
  placeholder = "例：パソコン、ピアノ、料理...",
  maxCount = 30,
}: SkillInputProps) {
  const [draft, setDraft] = useState("");

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (value.length >= maxCount) return;
    if (value.some((v) => v.toLowerCase() === s.toLowerCase())) return;
    onChange([...value, s]);
    setDraft("");
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      // delete last on backspace when input is empty
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-2 bg-bg border border-border rounded-xl min-h-[48px]">
        {value.map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            className="inline-flex items-center gap-1 bg-accent/15 text-accent rounded-full pl-3 pr-1.5 py-1 text-xs font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="hover:bg-accent/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
              aria-label="削除"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addSkill(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none px-1"
        />
      </div>

      {/* Suggestions */}
      {value.length < maxCount && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-text-mute py-0.5">候補：</span>
          {SUGGESTED.filter(
            (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
          )
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="text-[10px] text-text-mute hover:text-accent border border-border rounded-full px-2 py-0.5"
              >
                + {s}
              </button>
            ))}
        </div>
      )}

      <p className="text-[10px] text-text-mute">
        Enterまたはカンマで追加・✕で削除（{value.length}/{maxCount}）
      </p>
    </div>
  );
}
