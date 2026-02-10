"use client";

import { useState, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  /** Shimmer duration in ms before showing content */
  delayMs?: number;
};

export default function TacSummaryWithShimmer({ children, delayMs = 1000 }: Props) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!showContent) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-amber-50 border border-amber-100 px-4 py-4 w-full min-h-[140px]">
          <p className="text-xs font-semibold text-amber-700 mb-3">AI Summary</p>
          <div className="space-y-3" aria-hidden>
            <div className="h-3 w-full rounded-md shimmer-bg" />
            <div className="h-3 w-[95%] rounded-md shimmer-bg" />
            <div className="h-3 w-[88%] rounded-md shimmer-bg" />
            <div className="h-3 w-[70%] rounded-md shimmer-bg" />
            <div className="h-3 w-full rounded-md shimmer-bg" />
            <div className="h-3 w-[60%] rounded-md shimmer-bg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-in fade-in duration-300">
      {children}
    </div>
  );
}
