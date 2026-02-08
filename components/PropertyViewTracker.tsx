"use client";

import { useEffect, useRef } from "react";

export default function PropertyViewTracker({ postId }: { postId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!postId || sent.current) return;
    sent.current = true;
    fetch("/api/analytics/detail-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, [postId]);

  return null;
}
