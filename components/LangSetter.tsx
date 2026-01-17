"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LangSetter() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Extract lang from pathname (/en/... or /ja/...)
    const pathSegments = pathname.split('/').filter(Boolean);
    const lang = pathSegments[0] === 'en' || pathSegments[0] === 'ja' ? pathSegments[0] : 'en';
    
    // Set the lang attribute on the html element
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}
