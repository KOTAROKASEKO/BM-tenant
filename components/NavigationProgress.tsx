"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number | null>(null);

  // Detect navigation start: same-origin link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const href = (anchor as HTMLAnchorElement).getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname) return;
      } catch {
        return;
      }
      setVisible(true);
      setShowSpinner(true);
      setProgress(0);
      startRef.current = Date.now();
      // Simulate progress while loading
      const step = () => {
        setProgress((p) => {
          if (p >= 90) return p;
          const next = p + Math.random() * 8 + 4;
          return Math.min(next, 90);
        });
      };
      timerRef.current = setInterval(step, 200);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // On pathname change: complete the bar and hide
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setProgress(100);
      setShowSpinner(false);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      prevPathRef.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      {/* Top progress bar - fixed at top, visible on all devices */}
      <div
        className="fixed left-0 top-0 z-9999 h-0.5 bg-black transition-[width] duration-200 ease-out md:h-1"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      {/* Spinner overlay - only on phone (default mobile-first) */}
      <div
        className="fixed inset-0 z-9998 flex items-center justify-center bg-white/60 md:hidden"
        aria-hidden="true"
      >
        {showSpinner && (
          <div className="h-10 w-10 rounded-full border-2 border-zinc-200 border-t-black animate-spin" />
        )}
      </div>
    </>
  );
}
