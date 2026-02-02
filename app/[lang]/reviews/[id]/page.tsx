import Navbar from "@/components/Navbar";
import { Star, Shield, Trash2, Activity, ExternalLink, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/get-dictionary";
import { Metadata } from "next";

const baseUrl = 'https://bilikmatch.com';

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

// Resolve URL slug to Firestore doc in "condominiums". Doc ID = name as lowercase, spaces → "-" (e.g. "M vertica" → "m-vertica").
async function getDocSnapshot(id: string) {
  const col = adminDb.collection("condominiums");
  const decoded = decodeURIComponent(id).trim();
  let snap = await col.doc(decoded).get();
  if (snap.exists) return snap;
  const kebabId = decoded.toLowerCase().replace(/\s+/g, "-");
  snap = await col.doc(kebabId).get();
  if (snap.exists) return snap;
  const noSpaceId = decoded.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  snap = await col.doc(noSpaceId).get();
  return snap.exists ? snap : null;
}

// --- Fetch Function ---
async function getCondoData(id: string): Promise<CondoData | null> {
  if (!id) return null;
  try {
    const docSnap = await getDocSnapshot(id);
    if (!docSnap) return null;
    
    const data = docSnap.data() as any;
    // Firestore doc: name, location, imageUrl live under features; rating/tags/externalLinks at top level
    const features = data.features || {};
    const name = features.name ?? data.name ?? "Unknown Property";
    const location = features.location ?? data.location ?? "Malaysia";
    const imageUrl = features.imageUrl ?? data.imageUrl ?? "https://placehold.co/600x400?text=No+Image";

    return {
      id: docSnap.id,
      name,
      location,
      description: data.description || "Detailed reviews and scores for this property are analyzed below based on real tenant feedback.",
      rating: {
        overall: data.rating?.overall ?? 0,
        management: data.rating?.management ?? 0,
        security: data.rating?.security ?? 0,
        cleanliness: data.rating?.cleanliness ?? 0,
        facilities: data.rating?.facilities ?? 0,
      },
      tags: data.tags || [],
      externalLinks: data.externalLinks || [],
      imageUrl: imageUrl || "https://placehold.co/600x400?text=No+Image"
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; lang: string }> }): Promise<Metadata> {
  const { id, lang } = await params;
  const data = await getCondoData(id);
  const dict = await getDictionary(lang as "en" | "ja");
  if (!data) return { title: dict.reviews.review_not_found };
  
  const canonicalUrl = `${baseUrl}/${lang}/reviews/${id}`;
  const description = dict.reviews.reviews_meta_description.replace("{{name}}", data.name);
  
  return {
    title: `${data.name} ${dict.reviews.detail_title_suffix} | Bilik Match`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': `${baseUrl}/en/reviews/${id}`,
        'en': `${baseUrl}/en/reviews/${id}`,
        'ja': `${baseUrl}/ja/reviews/${id}`,
      },
    },
  };
}

export default async function CondoDetailPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id, lang } = await params;
  const data = await getCondoData(id);
  const dict = await getDictionary(lang as "en" | "ja");

  if (!data) return notFound();

  const details = [
    { label: dict.reviews.management_label, score: data.rating.management, icon: <Shield className="h-4 w-4"/> },
    { label: dict.reviews.security, score: data.rating.security, icon: <Shield className="h-4 w-4"/> },
    { label: dict.reviews.cleanliness, score: data.rating.cleanliness, icon: <Trash2 className="h-4 w-4"/> },
    { label: dict.reviews.facilities, score: data.rating.facilities, icon: <Activity className="h-4 w-4"/> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar dict={dict} />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href={`/${lang}/reviews`} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-black mb-6 transition-colors">
            <ArrowLeft className="h-3 w-3" /> {dict.reviews.back_to_reviews}
        </Link>
        
        {/* Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">{data.name}</h1>
            <p className="flex items-center gap-2 text-zinc-500 text-sm font-medium mb-6">
                <MapPin className="h-4 w-4" /> {data.location}
            </p>
            <div className="flex items-end gap-3">
                <div className="bg-black text-white px-4 py-2 rounded-xl text-3xl font-black">
                    {data.rating.overall}
                </div>
                <div className="mb-1">
                    <div className="flex text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(data.rating.overall) ? "fill-current" : "text-zinc-200"}`} />
                    ))}
                    </div>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">{dict.reviews.overall_score}</span>
                </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-full opacity-10 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Management Score Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-zinc-400" /> {dict.reviews.quality_breakdown}
            </h2>
            <div className="space-y-5">
              {details.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2 text-sm font-bold text-zinc-700">
                    <div className="flex items-center gap-2">
                      {item.icon} {item.label}
                    </div>
                    <span className="text-zinc-900">{item.score}</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.score >= 4 ? 'bg-emerald-500' : item.score >= 3 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                      style={{ width: `${(item.score / 5) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Card (Deal Breakers) */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="font-bold text-lg mb-6">{dict.reviews.real_tenant_feedback}</h2>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-transform hover:scale-105 ${
                    tag.type === 'negative' 
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {tag.type === 'negative' ? '⚠️' : '👍'} {tag.label}
                  <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[10px] ml-1 shadow-sm">{tag.count}</span>
                </span>
              ))}
            </div>
            <div className="mt-6 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 leading-relaxed">
               {dict.reviews.why_matters}
            </div>
          </div>
        </div>

        {/* Verification / External Links */}
        <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-4">{dict.reviews.verification_sources}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.externalLinks.map((link, i) => (
                    <a 
                        key={i} 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group flex flex-col p-4 bg-white rounded-xl border border-zinc-200 hover:border-black transition-all shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-zinc-900">{link.source}</span>
                            <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-black" />
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2">{link.summary || dict.reviews.click_to_view_source}</p>
                    </a>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}