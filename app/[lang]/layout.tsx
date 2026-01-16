import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ★ SEO対策: サイト全体のメタデータ設定
export const metadata: Metadata = {
  title: {
    template: '%s | Bilik Match',
    default: 'Bilik Match - Find Your Ideal Room in Malaysia',
  },
  description: "日本人向けの安心コンドミニアム探し。管理品質やリアルな口コミから、失敗しない物件選びをサポートします。",
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://bm-tenant.vercel.app',
    siteName: 'Bilik Match',
    images: [
      {
        url: 'https://bm-tenant.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bilik Match',
      },
    ],
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  
  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {/* Bottom Nav (モバイル用) - 常に表示 */}
        <BottomNav />
      </body>
    </html>
  );
}
