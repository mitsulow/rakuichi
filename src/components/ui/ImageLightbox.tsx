"use client";

import { useEffect, useState, useRef, type TouchEvent } from "react";

interface ImageLightboxProps {
  /** All images in the gallery. */
  images: string[];
  /** Index to start on. */
  startIndex?: number;
  onClose: () => void;
}

/**
 * Fullscreen image viewer. ESC, tap outside, or ✕ closes.
 * Swipe left/right (mobile) or arrow keys (desktop) to flip through.
 */
export function ImageLightbox({
  images,
  startIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [images.length, onClose]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) {
      setIndex((i) =>
        (i + (dx > 0 ? -1 : 1) + images.length) % images.length
      );
    }
    touchStart.current = null;
  };

  return (
    <div
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain cursor-default select-none"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="閉じる"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl flex items-center justify-center backdrop-blur-sm"
      >
        ✕
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + images.length) % images.length);
            }}
            aria-label="前の画像"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-lg flex items-center justify-center backdrop-blur-sm"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % images.length);
            }}
            aria-label="次の画像"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-lg flex items-center justify-center backdrop-blur-sm"
          >
            →
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
