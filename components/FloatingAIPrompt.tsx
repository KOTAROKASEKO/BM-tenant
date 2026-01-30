"use client";

import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";

type Props = {
  lang: string;
  placeholder?: string;
};

export default function FloatingAIPrompt({ lang, placeholder }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const goToAIChat = useCallback(() => {
    router.push(`/${lang}/ai-chat`);
  }, [router, lang]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToAIChat();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <div
        className="group relative overflow-hidden rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 shadow-[0_8px_32px_rgba(99,102,241,0.15),0_0_0_1px_rgba(99,102,241,0.08)] transition-all duration-300 hover:border-indigo-400 hover:shadow-[0_12px_40px_rgba(99,102,241,0.2),0_0_0_1px_rgba(99,102,241,0.12)] focus-within:border-indigo-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.4),0_12px_40px_rgba(99,102,241,0.2)]"
      >
        <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder ?? "Ask AI about rooms... Press Enter"}
            onKeyDown={handleKeyDown}
            onClick={goToAIChat}
            readOnly
            className="h-10 flex-1 min-w-0 bg-transparent text-base font-medium text-zinc-800 placeholder-zinc-500 outline-none cursor-pointer selection:bg-indigo-200/50"
            aria-label="Open AI chat"
          />
          <span className="hidden shrink-0 rounded-lg bg-indigo-100 px-2.5 py-1.5 text-xs font-bold text-indigo-700 sm:inline">
            Enter →
          </span>
        </div>
        <p className="border-t border-indigo-200/60 bg-indigo-50/80 px-4 py-2 text-center text-xs font-semibold text-indigo-800">
          ✦ AI room finder — tap or press Enter to open
        </p>
      </div>
    </div>
  );
}
