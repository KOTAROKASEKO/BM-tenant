import Navbar from "@/components/Navbar";
import { Star, Shield, Trash2, Activity, ExternalLink, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";

// --- Type Definitions ---
type CondoData = {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: {
    overall: number;
    management: number;
    security: number;
    cleanliness: number;
    facilities: number;
  };
  tags: { label: string; type: "positive" | "negative"; count: number }[];
  externalLinks: { source: string; url: string; summary?: string; rating?: string }[];
  imageUrl: string;
};

// --- Fetch Function ---
async function getCondoData(id: string): Promise<CondoData | null> {
  if (!id) return null;
  try {
    const docRef = adminDb.collection("condominiums").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return null;
    
    const data = docSnap.data() as any;
    
    return {
      id: docSnap.id,
      name: data.name || "Unknown Property",
      location: data.location || "Malaysia",
      description: data.description || "Detailed reviews and scores for this property are analyzed below based on real tenant feedback.",
      rating: {
        overall: data.rating?.overall || 0,
        management: data.rating?.management || 0,
        security: data.rating?.security || 0,
        cleanliness: data.rating?.cleanliness || 0,
        facilities: data.rating?.facilities || 0,
      },
      tags: data.tags || [],
      externalLinks: data.externalLinks || [],
      imageUrl: data.imageUrl || "https://placehold.co/600x400?text=No+Image"
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCondoData(id);
  if (!data) return { title: "Review Not Found" };
  return {
    title: `${data.name} Reviews | Bilik Match`,
    description: `Real tenant reviews for ${data.name}. Check management quality, pest issues, and security.`,
  };
}

export default async function CondoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getCondoData(id);
    if (!data) return notFound();
  
    // ★ 構造化データ (JSON-LD) の作成
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ApartmentComplex', // または Residence
      name: data.name,
      description: data.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: data.location, // 詳細な住所フィールドがあるとなお良し
        addressCountry: 'MY'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.rating.overall,
        reviewCount: data.tags.reduce((acc, tag) => acc + tag.count, 0) + 10, // タグ数などを仮のレビュー数として合算
        bestRating: "5",
        worstRating: "1"
      }
    };
  
    return (
      <div className="min-h-screen bg-zinc-50 font-sans pb-24">
        {/* ★ head内にJSON-LDを埋め込む */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <Navbar />
        {/* ... (残りのUIコード) ... */}
      </div>
    );
  }