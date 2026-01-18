// app/[lang]/page.tsx
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Search, MapPin, ShieldCheck, GraduationCap, Home } from "lucide-react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";

// Generate metadata based on language
1
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  if (lang === "ja") {
    return {
      title: "マレーシア・クアラルンプールの部屋探し・留学生活サポート | Bilik Match",
      description: "マレーシア（KL）への留学・移住が決まったらBilik Match。日本人学生や駐在員向けに、治安が良く管理のしっかりしたコンドミニアム・シェアハウスを厳選してご紹介。エージェントとの直接チャットで安心の部屋探し。",
      keywords: ["マレーシア 部屋探し", "クアラルンプール 賃貸", "マレーシア留学", "学生寮", "日本人向け コンドミニアム"],
    };
  }
  
  return {
    title: "Find Your Ideal Room in Malaysia | Bilik Match",
    description: "Search for safe and well-managed condominiums and shared houses for students and expatriates in Kuala Lumpur (KL). Find your ideal living space with real reviews and AI chat.",
    keywords: ["Malaysia room search", "Kuala Lumpur rental", "Malaysia study abroad", "student housing", "condominium for students"],
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
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      <Navbar dict={dict} />

      {/* --- Hero Section (検索バー付き) --- */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center lg:py-32 overflow-hidden">
        {/* 背景装飾（お好みで画像などに変更可能） */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 via-white to-white opacity-70"></div>

        <div className="animate-fade-in-up max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-600 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-purple-600"></span>
            {dict.landing.badge}
          </div>
          
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {lang === "ja" ? (
              <>
                {dict.landing.hero_title_line1}<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {dict.landing.hero_title_highlight}
                </span>
                {dict.landing.hero_title_line2}
              </>
            ) : (
              <>
                {dict.landing.hero_title_line1}<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {dict.landing.hero_title_highlight}
                </span>
                <br className="hidden sm:block" />
                {dict.landing.hero_title_line2}
              </>
            )}
          </h1>
          
          <p 
            className="mx-auto max-w-2xl text-lg text-zinc-600"
            dangerouslySetInnerHTML={{ __html: dict.landing.hero_description }}
          />

          {/* --- 検索フォーム（/propertyへ遷移） --- */}
          <div className="mx-auto max-w-lg w-full mt-8">
            <form action={`/${lang}/property`} method="GET" className="relative flex items-center shadow-xl rounded-2xl overflow-hidden border border-zinc-200 bg-white transition-all focus-within:ring-2 focus-within:ring-black">
              <Search className="absolute left-4 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                name="q"
                placeholder={dict.landing.search_placeholder}
                className="h-14 w-full pl-12 pr-4 text-base outline-none placeholder:text-zinc-400"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 rounded-xl bg-black px-6 text-sm font-bold text-white transition-transform hover:scale-105 hover:bg-zinc-800"
              >
                {dict.landing.search_button}
              </button>
            </form>
            <p className="mt-3 text-xs text-zinc-400">
              {dict.landing.popular_keywords} <Link href={`/${lang}/property?q=Sunway`} className="underline hover:text-black">Sunway</Link>, <Link href={`/${lang}/property?q=Monash`} className="underline hover:text-black">Monash</Link>, <Link href={`/${lang}/property?q=KLCC`} className="underline hover:text-black">KLCC</Link>, <Link href={`/${lang}/property?q=Mont Kiara`} className="underline hover:text-black">Mont Kiara</Link>
            </p>
          </div>
        </div>
      </section>

      {/* --- SEO Content Sections --- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          
          {/* Feature 1 */}
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">{dict.landing.feature1_title}</h3>
            <p className="text-zinc-600 leading-relaxed">
              {dict.landing.feature1_description}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">{dict.landing.feature2_title}</h3>
            <p className="text-zinc-600 leading-relaxed">
              {dict.landing.feature2_description}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">{dict.landing.feature3_title}</h3>
            <p className="text-zinc-600 leading-relaxed">
              {dict.landing.feature3_description}
            </p>
          </div>

        </div>
      </section>

      {/* --- Footer Links (SEO Internal Linking) --- */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">{dict.landing.footer_title}</h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-zinc-600">
             <Link href={`/${lang}/property?q=Bangsar`} className="hover:text-black hover:underline">{dict.landing.footer_link1}</Link>
             <Link href={`/${lang}/property?q=Subang`} className="hover:text-black hover:underline">{dict.landing.footer_link2}</Link>
             <Link href={`/${lang}/property?q=Bukit Bintang`} className="hover:text-black hover:underline">{dict.landing.footer_link3}</Link>
             <Link href={`/${lang}/property?q=Cyberjaya`} className="hover:text-black hover:underline">{dict.landing.footer_link4}</Link>
          </div>
          <p className="mt-8 text-xs text-zinc-400">
            {dict.landing.footer_copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
