// app/[lang]/page.tsx
import Navbar from "@/components/Navbar";
import FloatingAIPrompt from "@/components/FloatingAIPrompt";
import JsonLd from "@/components/JsonLd";
import LifeSimulatorLottie from "@/components/LifeSimulatorLottie";
import { Search, ShieldCheck, GraduationCap, Home, MessageSquareHeart, Zap, MapPin, Navigation, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";
import Image from "next/image"; // 画像表示用にちついか

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
  const isJa = lang === 'ja';

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <JsonLd lang={lang} isHomePage />
      <Navbar dict={dict} />

      {/* ================= Hero ================= */}
      <section className="relative px-4 pt-24 pb-16 lg:pt-32">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Title */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl drop-shadow-sm">
              {dict.landing.hero_title_for_japanese}<br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                {dict.landing.hero_title_room_hunting}
              </span>
            </h1>
            {/* Subtitle / SEO Text */}
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              {isJa 
                ? "マレーシアでの新生活、部屋探しから始めませんか？AIがあなたの希望にぴったりのコンドミニアムをご提案します。" 
                : "Start your new life in Malaysia with the perfect room. Our AI suggests condominiums that match your needs perfectly."}
            </p>
          </div>

          {/* ================= Search Section ================= */}
          <div className="space-y-4">
            <div className="mx-auto max-w-2xl">
              <form
                action={`/${lang}/property`}
                method="GET"
                className="relative flex items-center rounded-2xl border-2 border-zinc-200 bg-white shadow-lg transition hover:border-indigo-300 hover:shadow-xl"
              >
                <Search className="absolute left-6 h-6 w-6 text-zinc-400" />
                <input
                  type="text"
                  name="q"
                  placeholder={dict.landing.search_placeholder}
                  className="h-16 w-full rounded-2xl bg-transparent pl-16 pr-6 text-lg outline-none placeholder:text-zinc-400"
                />
              </form>
            </div>
            <p className="text-center text-sm text-zinc-500">
              {dict.landing.search_hint}
            </p>
          </div>
        </div>
      </section>

      {/* ================= Life Simulator Feature ================= */}
      <section className="py-20 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-3xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-2 lg:items-center">
              <div className="p-8 lg:p-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100">
                  <Navigation className="h-4 w-4" />
                  {dict.landing.life_simulator_title}
                </div>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl text-zinc-900">
                  {dict.landing.life_simulator_catch}
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  {dict.landing.life_simulator_desc}
                </p>
                <a
                  href={`/${lang}/property`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors"
                >
                  {dict.landing.life_simulator_cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-zinc-100 p-8 lg:p-12 flex items-center justify-center min-h-[240px]">
                <LifeSimulatorLottie />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Pain Points & Solution (SEO Enrichment) ================= */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Left: Text Content */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                {isJa ? (
                  <>
                    マレーシア移住・留学の<br />
                    <span className="text-indigo-600">「不安」</span>を<span className="text-indigo-600">「ワクワク」</span>に。
                  </>
                ) : (
                  "Turn your anxiety about moving to Malaysia into excitement."
                )}
              </h2>
              
              <div className="space-y-6 text-zinc-600 text-lg leading-relaxed">
                {isJa ? (
                  <>
                    <p>
                      初めての海外生活や留学は、期待と同じくらい不安がつきものです。「現地の治安は大丈夫？」「英語で不動産エージェントと交渉するのはハードルが高い…」。
                    </p>
                    <p>
                      特に、何人ものエージェントに問い合わせても返信がなかったり、外国人であることを理由に断られたりするのは、部屋探しで最も消耗する瞬間です。
                    </p>
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-600" />
                        BilikMatchが解決します
                      </h3>
                      <p className="text-indigo-800 text-base">
                        24時間365日、どこでもAIに相談可能。あなたの好みや条件、そして不安な気持ちに寄り添い、最適なコンドミニアムをご提案します。面倒な英語での交渉や手続きの不安は、AIとプラットフォームにお任せください。
                      </p>
                    </div>
                  </>
                ) : (
                  <p>
                    Moving to a new country can be stressful. Language barriers, unresponsive agents, and uncertainty about safety are common challenges. BilikMatch solves this with 24/7 AI support, handling the hard work so you can focus on your new life.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Visual Representation */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-tr from-indigo-100 to-purple-50 p-8 flex flex-col justify-center items-center text-center space-y-6 shadow-inner">
                 {/* Decorative Elements simulating chat/relief */}
                 <div className="bg-white p-4 rounded-2xl shadow-lg w-full max-w-xs transform -rotate-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">🤖</div>
                      <div className="text-xs font-bold text-zinc-500">BilikMatch AI</div>
                    </div>
                    <p className="text-sm text-left text-zinc-700">
                      {isJa ? "治安が良くて、駅近で、ジムがある部屋を探しています。" : "I'm looking for a safe room near the station with a gym."}
                    </p>
                 </div>
                 <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg w-full max-w-xs transform rotate-2">
                    <p className="text-sm text-left text-white">
                      {isJa ? "お任せください！モントキアラ周辺で、セキュリティ万全・プール付きの人気コンドミニアムを3つピックアップしました。" : "Leave it to me! I've picked 3 popular condos in Mont Kiara with great security and pools."}
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Gallery / Popular Condos ================= */}
      <section className="py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {isJa ? "理想のライフスタイルを見つけよう" : "Find Your Ideal Lifestyle"}
            </h2>
            <p className="text-zinc-600">
              {isJa ? "プール、ジム、コワーキングスペース完備。マレーシアならではの充実した設備。" : "Pools, gyms, coworking spaces. Enjoy the full facilities unique to Malaysia."}
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder Images - Replace src with actual images later */}
            <GalleryItem 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800"
              label={isJa ? "モダンな内装" : "Modern Interiors"}
              desc={isJa ? "家具付きですぐに生活スタート" : "Fully furnished"}
            />
            <GalleryItem 
              src="https://images.unsplash.com/photo-1572331165267-854da2b00ca1?auto=format&fit=crop&q=80&w=800"
              label={isJa ? "インフィニティプール" : "Infinity Pools"}
              desc={isJa ? "休日はプールサイドでリラックス" : "Relax by the pool"}
            />
            <GalleryItem 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"
              label={isJa ? "充実のジム設備" : "Fully Equipped Gyms"}
              desc={isJa ? "健康的な毎日をサポート" : "Support your healthy life"}
            />
          </div>
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Why BilikMatch?</h2>
        </div>
        <div className="grid gap-12 lg:grid-cols-3">
          <Feature
            icon={<GraduationCap className="h-8 w-8 text-indigo-600" />}
            title={dict.landing.feature1_title_short}
            text={dict.landing.feature1_text_short}
          />
          <Feature
            icon={<ShieldCheck className="h-8 w-8 text-indigo-600" />}
            title={dict.landing.feature2_title_short}
            text={dict.landing.feature2_text_short}
          />
          <Feature
            icon={<MessageSquareHeart className="h-8 w-8 text-indigo-600" />}
            title={dict.landing.feature3_title_short}
            text={dict.landing.feature3_text_short}
          />
        </div>
      </section>

      {/* Floating AI prompt */}
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
    <div className="group rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-md border border-zinc-100">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-zinc-900">{title}</h3>
      <p className="text-zinc-600 leading-relaxed">{text}</p>
    </div>
  );
}

function GalleryItem({ src, label, desc }: { src: string; label: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl aspect-[4/3]">
      <Image 
        src={src} 
        alt={label}
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
        <h3 className="font-bold text-lg">{label}</h3>
        <p className="text-sm text-zinc-200">{desc}</p>
      </div>
    </div>
  );
}