// app/[lang]/page.tsx
import Navbar from "@/components/Navbar";
import FloatingAIPrompt from "@/components/FloatingAIPrompt";
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
  const dict = await getDictionary(lang as "en" | "ja");
  const canonicalUrl = `${baseUrl}/${lang}`;
  const landing = dict.landing as Record<string, string>;

  return {
    title: lang === "ja" ? landing.meta_title_ja : landing.meta_title_en,
    description: lang === "ja" ? landing.meta_description_ja : landing.meta_description_en,
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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-900 text-zinc-900">
      <Navbar dict={dict} />

      {/* ================= Hero ================= */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {dict.landing.hero_title_for_japanese}<br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                {dict.landing.hero_title_room_hunting}
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
                  placeholder={dict.landing.search_placeholder}
                  className="h-16 w-full pl-12 pr-4 text-base outline-none"
                />
              </form>
            </div>
            <p className="text-center text-sm text-zinc-200">
              {dict.landing.search_hint}
            </p>
          </div>
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <Feature
            icon={<GraduationCap className="h-6 w-6" />}
            title={dict.landing.feature1_title_short}
            text={dict.landing.feature1_text_short}
          />
          <Feature
            icon={<ShieldCheck className="h-6 w-6" />}
            title={dict.landing.feature2_title_short}
            text={dict.landing.feature2_text_short}
          />
          <Feature
            icon={<Home className="h-6 w-6" />}
            title={dict.landing.feature3_title_short}
            text={dict.landing.feature3_text_short}
          />
        </div>
      </section>

      {/* Floating AI prompt: Enter or click → AI chat */}
      <FloatingAIPrompt
        lang={lang}
        placeholder={dict.landing.ai_prompt_placeholder}
      />
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