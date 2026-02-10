import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/get-dictionary";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TacSummaryWithShimmer from "@/components/TacSummaryWithShimmer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

async function getTacData(id: string) {
  if (!id) return null;
  try {
    const postDoc = await adminDb.collection("posts").doc(id).get();
    if (!postDoc.exists) return null;
    const d = postDoc.data()!;
    return {
      id: postDoc.id,
      condominiumName: d.condominiumName || "Property",
      tacFileUrl: d.tacFileUrl || null,
      tacFileName: d.tacFileName || null,
      tacAnalysisText: d.tacAnalysisText || null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  const data = await getTacData(id);
  if (!data) return { title: "TAC Analysis | Bilik Match" };
  return {
    title: `TAC AI Analysis - ${data.condominiumName} | Bilik Match`,
  };
}

export default async function TacAnalysisPage({ params }: Props) {
  const { id, lang } = await params;
  if (!id) return notFound();

  const data = await getTacData(id);
  if (!data) return notFound();
  if (!data.tacFileUrl) return notFound();

  const dict = await getDictionary(lang as "en" | "ja");

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar dict={dict} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`/${lang}/property/${id}`}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to property
        </Link>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-gradient-to-br from-amber-50 to-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">TAC AI Analysis</h1>
                <p className="text-sm text-zinc-500">{data.condominiumName}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* User prompt (fixed text) — top-right style */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-100 px-4 py-3 text-right">
                <p className="text-sm font-medium text-zinc-800">
                  Is it ok to sign up this form? Please read through it and let me know if there is any suspicious information. The TAC is here:
                </p>
              </div>
            </div>

            {/* AI response (summary) — 1s shimmer then reveal */}
            {data.tacAnalysisText ? (
              <TacSummaryWithShimmer delayMs={3000}>
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-amber-50 border border-amber-100 px-4 py-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2">AI Summary</p>
                  <div className="prose prose-zinc max-w-none text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {data.tacAnalysisText}
                    </ReactMarkdown>
                  </div>
                </div>
              </TacSummaryWithShimmer>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-zinc-50 border border-zinc-200 px-4 py-4 text-center">
                  <p className="text-zinc-500 font-medium mb-2">AI analysis is not available yet.</p>
                  <p className="text-sm text-zinc-400 mb-4">The agent may add analysis later, or you can read the TAC document directly.</p>
                  <a
                    href={data.tacFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                  >
                    <FileText className="h-4 w-4" /> View TAC document
                  </a>
                </div>
              </div>
            )}

            {data.tacAnalysisText && data.tacFileUrl && (
              <div className="pt-4 border-t border-zinc-100">
                <a
                  href={data.tacFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-black"
                >
                  <FileText className="h-4 w-4" /> Open original TAC document
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
