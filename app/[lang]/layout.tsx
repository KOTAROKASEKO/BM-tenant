import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import LangSetter from "@/components/LangSetter";
import { headers } from "next/headers";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = 'https://bilikmatch.com';

// ★ SEO対策: サイト全体のメタデータ設定
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || `/${lang}`;
  
  // Ensure pathname starts with the language prefix
  const currentPath = pathname.startsWith(`/${lang}`) ? pathname : `/${lang}`;
  const canonicalUrl = `${baseUrl}${currentPath}`;
  
  return {
    title: {
      template: '%s | Bilik Match',
      default: 'Bilik Match - Find Your Ideal Room in Malaysia',
    },
    description: "日本人向けの安心コンドミニアム探し。管理品質やリアルな口コミから、失敗しない物件選びをサポートします。",
    openGraph: {
      type: 'website',
      locale: lang === 'ja' ? 'ja_JP' : 'en_US',
      url: canonicalUrl,
      siteName: 'Bilik Match',
      images: [
        {
          url: 'https://bilikmatch.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Bilik Match',
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en`,
        'ja': `${baseUrl}/ja`,
      },
    },
  };
}

export default async function LangLayout({
  
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  
  return (
    <>
      <LangSetter />
      {children}
      
      {/* Bottom Nav (モバイル用) - 常に表示 */}
      <BottomNav />
    </>
  );
}
