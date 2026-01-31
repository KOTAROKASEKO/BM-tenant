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
  
  const isJa = lang === 'ja';
  const defaultTitle = isJa
    ? 'マレーシア 賃貸・移住の部屋探し | Bilik Match'
    : 'Bilik Match - Find Your Ideal Room in Malaysia';
  const defaultDescription = isJa
    ? 'マレーシア移住・マレーシア賃貸の部屋探し。日本人向けKL周辺の賃貸物件を無料で紹介。日本語対応。'
    : 'Find your ideal room in Malaysia. Search for safe and well-managed condominiums with real reviews.';

  return {
    title: {
      template: '%s | Bilik Match',
      default: defaultTitle,
    },
    description: defaultDescription,
    ...(isJa && {
      keywords: ['マレーシア 賃貸', 'マレーシア 移住', 'マレーシア 部屋探し', 'KL 賃貸', 'クアラルンプール 賃貸', 'マレーシア 留学', '日本人 マレーシア 賃貸'].join(', '),
    }),
    openGraph: {
      type: 'website',
      locale: isJa ? 'ja_JP' : 'en_US',
      url: canonicalUrl,
      siteName: 'Bilik Match',
      title: isJa ? 'マレーシア 賃貸・移住の部屋探し | Bilik Match' : undefined,
      description: isJa ? defaultDescription : undefined,
      images: [
        {
          url: 'https://bilikmatch.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: isJa ? 'マレーシア賃貸・移住の部屋探し Bilik Match' : 'Bilik Match',
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
      
      {/* Bottom Nav: hidden on phone; use drawer Home → Discover instead */}
      <BottomNav />
    </>
  );
}
