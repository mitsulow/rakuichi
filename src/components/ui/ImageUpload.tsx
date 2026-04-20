"use client";

import { useState, useRef } from "react";
import { uploadImage, type ImageBucket } from "@/lib/storage";

interface ImageUploadProps {
  bucket: ImageBucket;
  userId: string;
  value?: string | null; // current single image URL
  values?: string[]; // current multiple image URLs
  multiple?: boolean;
  maxCount?: number;
  onChange?: (url: string | null) => void; // single mode
  onChangeMany?: (urls: string[]) => void; // multiple mode
  placeholder?: string;
  aspect?: "square" | "wide" | "free";
  className?: string;
}

export function ImageUpload({
  bucket,
  userId,
  value,
  values,
  multiple = false,
  maxCount = 4,
  onChange,
  onChangeMany,
  placeholder = "画像を追加",
  aspect = "free",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = multiple ? values ?? [] : value ? [value] : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const toUpload = Array.from(files).slice(0, multiple ? maxCount - current.length : 1);
    const uploaded: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) continue;
      const result = await uploadImage(bucket, file, userId);
      if (result.url) uploaded.push(result.url);
      else if (result.error) setError(result.error);
    }

    setUploading(false);

    if (uploaded.length === 0) return;

    if (multiple) {
      onChangeMany?.([...(values ?? []), ...uploaded]);
    } else {
      onChange?.(uploaded[0]);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (index: number) => {
    if (multiple) {
      const next = (values ?? []).filter((_, i) => i !== index);
      onChangeMany?.(next);
    } else {
      onChange?.(null);
    }
  };

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "wide"
      ? "aspect-[16/9]"
      : "";

  const canAdd = multiple ? current.length < maxCount : current.length === 0;

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {current.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className={`relative ${aspectClass} rounded-xl overflow-hidden border border-border bg-bg`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
              aria-label="削除"
            >
              ✕
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`${aspectClass} border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors text-text-mute disabled:opacity-60 min-h-[80px]`}
          >
            {uploading ? (
              <>
                <span className="text-xl animate-pulse">⏳</span>
                <span className="text-xs">アップロード中...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span className="text-xs">{placeholder}</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
