"use client";

import { useEffect, useState } from "react";

/**
 * Floating "back to top" button. Appears when scrolled past 600px and lives
 * above the BottomNav. Tap → smooth scroll to page top.
 */
export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページの上に戻る"
      className="fixed right-4 bottom-20 md:bottom-4 z-40 w-10 h-10 rounded-full bg-card border border-border shadow-md hover:shadow-lg flex items-center justify-center text-base hover:scale-110 transition-all"
      style={{ color: "#c94d3a" }}
    >
      ↑
    </button>
  );
}
