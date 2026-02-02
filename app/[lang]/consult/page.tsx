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
  const isJa = lang === "ja";

  return {
    title: isJa ? "マレーシア 賃貸 無料相談（物件3件紹介） | Bilik Match" : "Free Consultation (3 Properties) | Bilik Match",
    description: isJa
      ? "マレーシア移住・マレーシア賃貸の無料相談。条件を伺い、日本語対応エージェントから最大3件だけ物件をご紹介。"
      : "Get up to 3 property introductions from Japanese-friendly agents. Free consultation.",
    ...(isJa && { keywords: "マレーシア 賃貸 相談, マレーシア 移住 相談, KL 賃貸 無料相談" }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': `${baseUrl}/en/consult`,
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
