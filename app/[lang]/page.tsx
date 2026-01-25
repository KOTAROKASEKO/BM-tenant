// app/[lang]/page.tsx
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Search, ShieldCheck, GraduationCap, Home } from "lucide-react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";

const baseUrl = 'https://bilikmatch.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const canonicalUrl = `${baseUrl}/${lang}`;

  if (lang === "ja") {
    return {
      title: "マレーシア・KLの部屋探し｜日本人向け無料相談・3件紹介 | Bilik Match",
      description:
        "日本人向けマレーシア部屋探し。条件を伺い、日本語対応エージェントから最大3件だけ物件をご紹介。しつこい営業なし。",
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'en': `${baseUrl}/en`,
          'ja': `${baseUrl}/ja`,
        },
      },
    };
  }

  return {
    title: "Japanese-Friendly Room Finder in Malaysia | Bilik Match",
    description:
      "Get up to 3 carefully selected rooms in Malaysia from Japanese-friendly agents. Free consultation.",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en`,
        'ja': `${baseUrl}/ja`,
      },
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar dict={dict} />

      {/* ================= Hero ================= */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              日本人向け<br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                マレーシアの部屋探し
              </span>
            </h1>
          </div>

          {/* ================= Search Section ================= */}
          <div className="space-y-4">
            <div className="mx-auto max-w-2xl">
              <form
                action={`/${lang}/property`}
                method="GET"
                className="relative flex items-center rounded-2xl border-2 border-zinc-200 bg-white shadow-lg transition hover:border-zinc-300 hover:shadow-xl"
              >
                <Search className="absolute left-4 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="エリア・学校名など（例: Sunway, KLCC, Monash）"
                  className="h-16 w-full pl-12 pr-4 text-base outline-none"
                />
              </form>
            </div>
            <p className="text-center text-sm text-zinc-500">
              まずは自分で探してみる
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-zinc-400">または</span>
            </div>
          </div>

          {/* ================= Consult Section ================= */}
          <div className="space-y-4 text-center">
            <div>
              <p className="text-lg text-zinc-700">
                見つからない場合は、専門家に無料で相談
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                相談も、無料で承っております。
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Link
                href={`/${lang}/consult`}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-black px-10 text-base font-bold text-white shadow-xl transition hover:scale-105 hover:bg-zinc-800"
              >
                無料で相談する（物件3件紹介）
              </Link>
              <p className="text-xs text-zinc-500">
                しつこい営業なし・日本語対応のみ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <Feature
            icon={<GraduationCap className="h-6 w-6" />}
            title="日本人向けに特化"
            text="留学生・駐在員など、日本人の事情を理解した対応。"
          />
          <Feature
            icon={<ShieldCheck className="h-6 w-6" />}
            title="日本語で安心"
            text="契約や条件確認も日本語でサポート。"
          />
          <Feature
            icon={<Home className="h-6 w-6" />}
            title="数より質"
            text="大量紹介ではなく、条件に合う3件のみ。"
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-zinc-600">{text}</p>
    </div>
  );
}