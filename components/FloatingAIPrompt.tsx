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
        className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300 hover:border-zinc-300 hover:shadow-xl focus-within:border-cyan-400/70 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.2)]"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 25px 50px -12px rgba(0,0,0,0.15)",
        }}
      >
        <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder ?? "Ask AI about rooms... Press Enter"}
            onKeyDown={handleKeyDown}
            onClick={goToAIChat}
            readOnly
            className="h-10 flex-1 min-w-0 bg-transparent text-base text-zinc-700 placeholder-zinc-400 outline-none cursor-pointer selection:bg-cyan-200/50"
            aria-label="Open AI chat"
          />
          <span className="hidden shrink-0 text-xs font-medium text-cyan-600 sm:inline">
            Enter →
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-zinc-500">
        AI room finder
      </p>
    </div>
  );
}
