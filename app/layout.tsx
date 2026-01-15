import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

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
    template: '%s | Bilik Match', // 各ページでタイトルを設定すると "ページ名 | Bilik Match" になります
    default: 'Bilik Match - Find Your Ideal Room in Malaysia', // デフォルトのタイトル
  },
  description: "日本人向けの安心コンドミニアム探し。管理品質やリアルな口コミから、失敗しない物件選びをサポートします。",
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://bm-tenant.vercel.app',
    siteName: 'Bilik Match',
    images: [
      {
        url: 'https://bm-tenant.vercel.app/og-image.jpg', // publicフォルダにog-image.jpgを置くことを推奨
        width: 1200,
        height: 630,
        alt: 'Bilik Match',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Top Nav (Navbar) は各ページ個別に配置しているためここでは省略しています。
            全ページ共通にする場合はここに <Navbar /> を追加してください。 */}
        
        {children}
        
        {/* Bottom Nav (モバイル用) - 常に表示 */}
        <BottomNav />
      </body>
    </html>
  );
}