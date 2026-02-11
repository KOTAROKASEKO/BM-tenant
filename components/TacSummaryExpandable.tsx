"use client";

import { useState } from "react";
import { FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TacSummaryWithShimmer from "./TacSummaryWithShimmer";

type Props = {
  tacFileUrl: string;
  tacFileName?: string | null;
  tacAnalysisText?: string | null;
  /** Shimmer delay in ms when expanded */
  shimmerDelayMs?: number;
};

const USER_PROMPT =
  "Is it ok to sign up this form? Please read through it and let me know if there is any suspicious information. The TAC is here:";

export default function TacSummaryExpandable({
  tacFileUrl,
  tacFileName,
  tacAnalysisText,
  shimmerDelayMs = 3000,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header: always visible, click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-6 flex flex-wrap items-center gap-4 text-left hover:bg-zinc-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-zinc-900">TAC Document</p>
            <p className="text-sm text-zinc-500">{tacFileName || "Title & Conditions"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <a
            href={tacFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl font-bold text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <FileText className="h-4 w-4" /> View document
          </a>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl font-bold text-sm">
            <Sparkles className="h-4 w-4" /> See AI analysis
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {/* Expandable body: prompt + summary (no navigation) */}
      {open && (
        <div className="px-6 pb-6 pt-0 space-y-4 border-t border-zinc-100">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-100 px-4 py-3 text-right">
              <p className="text-sm font-medium text-zinc-800">{USER_PROMPT}</p>
            </div>
          </div>

          {tacAnalysisText ? (
            <TacSummaryWithShimmer delayMs={shimmerDelayMs}>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-amber-50 border border-amber-100 px-4 py-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">AI Summary</p>
                <div className="prose prose-zinc max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tacAnalysisText}</ReactMarkdown>
                </div>
              </div>
            </TacSummaryWithShimmer>
          ) : (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-zinc-50 border border-zinc-200 px-4 py-4 text-center">
                <p className="text-zinc-500 font-medium mb-2">AI analysis is not available yet.</p>
                <p className="text-sm text-zinc-400 mb-4">
                  The agent may add analysis later, or you can read the TAC document directly.
                </p>
                <a
                  href={tacFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                >
                  <FileText className="h-4 w-4" /> View TAC document
                </a>
              </div>
            </div>
          )}

          {tacAnalysisText && (
            <div className="pt-2">
              <a
                href={tacFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-black"
              >
                <FileText className="h-4 w-4" /> Open original TAC document
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
