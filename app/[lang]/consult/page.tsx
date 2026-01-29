// app/[lang]/consult/page.tsx
// Consultation is no longer offered; page kept for backwards compatibility.
import Link from "next/link";
import ConsultForm from "../consult/ConsultForm";
import { Metadata } from "next";

const baseUrl = 'https://bilikmatch.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const canonicalUrl = `${baseUrl}/${lang}/consult`;

  return {
    title: "無料相談（物件3件紹介） | Bilik Match",
    description: "条件をもとに、日本語対応エージェントから最大3件だけ物件をご紹介します。",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en/consult`,
        'ja': `${baseUrl}/ja/consult`,
      },
    },
  };
}

export default async function ConsultPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-white px-4 py-20">
      <div className="mx-auto max-w-xl">
        <Link href={`/${lang}`} className="text-sm text-zinc-500 underline">
          ← 戻る
        </Link>
        <ConsultForm />
      </div>
    </div>
  );
}
