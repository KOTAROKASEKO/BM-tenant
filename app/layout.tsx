import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // テンプレート機能を使うと、各ページで "物件名 | Bilik Match" のように自動付与されます
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
        url: 'https://bm-tenant.vercel.app/og-image.jpg', // TOPページのOGP画像を用意推奨
        width: 1200,
        height: 630,
        alt: 'Bilik Match',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top Nav (visible on desktop) */}
        {/* You can remove Navbar from individual pages now if you put it here */}
        
        {children}
        
        {/* Bottom Nav (visible on mobile only) */}
        <BottomNav />
      </body>
    </html>
  );
}
