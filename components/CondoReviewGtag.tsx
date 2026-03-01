"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function CondoReviewGtag() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.href.includes("/reviews")) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "click_condo_review", {
      send_to: "G-647TM3TDXQ",
    });
  }, []);

  return null;
}
