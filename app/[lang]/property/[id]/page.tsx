import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { MapPin, CheckCircle2, MessageCircle, Phone, ArrowLeft, Bus, Star, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/get-dictionary";
import PropertyImageCarousel from "@/components/PropertyImageCarousel";
import CommuteChecker from "@/components/CommuteChecker";
import ChatButton from "@/components/ChatButton";
import PropertyViewTracker from "@/components/PropertyViewTracker";
import DescriptionSection from "@/components/DescriptionSection";
import SaveButton from "@/components/SaveButton";
import TacSummaryExpandable from "@/components/TacSummaryExpandable";

// --- 型定義 ---
type AgentProfile = {
  name: string;
  verified: boolean;
  photo: string;
  phoneNumber?: string;
};

type PropertyData = {
  id: string;
  condominiumName: string;
  location: string;
  rent: number;
  description: string;
  roomType: string;
  gender: string;
  securityDeposit: number;
  utilityDeposit: number;
  images: string[];
  userId?: string;
  agent: AgentProfile;
  tacFileUrl?: string | null;
  tacFileName?: string | null;
  tacAnalysisText?: string | null;
};

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

// --- コンドミニアムID検索関数 ---

async function findCondoIdByName(condominiumName: string): Promise<{ id: string, rating: number } | null> {
  if (!condominiumName) return null;
  
  try {
    // 1. 名前での完全一致検索
    let snapshot = await adminDb
      .collection("condominiums")
      .where("name", "==", condominiumName)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return { id: snapshot.docs[0].id, rating: data?.rating?.overall || 0 };
    }

    // 2. ID（スラッグ）での検索 (例: "M Vertica" -> "m-vertica")
    const kebabId = condominiumName.toLowerCase().trim().replace(/\s+/g, '-');
    let docRef = await adminDb.collection("condominiums").doc(kebabId).get();
    
    if (docRef.exists) {
        const data = docRef.data();
        return { id: docRef.id, rating: data?.rating?.overall || 0 };
    }

    // 3. スペース無しIDでの検索 (例: "M Vertica" -> "mvertica")
    const noSpaceId = condominiumName.toLowerCase().replace(/\s+/g, '');
    docRef = await adminDb.collection("condominiums").doc(noSpaceId).get();

    if (docRef.exists) {
        const data = docRef.data();
        return { id: docRef.id, rating: data?.rating?.overall || 0 };
    }
    
    return null;
  } catch (error) {
    console.error("Error finding condo ID:", error);
    return null;
  }
}

// --- データ取得関数 (Server Side) ---
async function getPropertyData(id: string): Promise<PropertyData | null> {
  if (!id) return null;

  try {
    const postDoc = await adminDb.collection("posts").doc(id).get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data()!;

    // エージェント情報の取得
    let agentInfo: AgentProfile = {
      name: "Unknown Agent",
      verified: false,
      photo: "https://ui-avatars.com/api/?name=Agent",
    };

    if (postData.userId) {
      try {
        const userDoc = await adminDb.collection("users_prof").doc(postData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          agentInfo = {
            name: userData.displayName || "Agent",
            verified: userData.isVerified || false,
            photo: userData.profileImageUrl || `https://ui-avatars.com/api/?name=${userData.displayName || 'Agent'}`,
            phoneNumber: userData.phoneNumber || ""
          };
        }
      } catch (err) {
        console.error("Error fetching agent details:", err);
      }
    }

    return {
      id: postDoc.id,
      condominiumName: postData.condominiumName || "Untitled Property",
      location: postData.location || "No location provided",
      rent: Number(postData.rent) || 0,
      description: postData.description || "No description available.",
      roomType: postData.roomType || "Room",
      gender: postData.gender || "Mix",
      securityDeposit: Number(postData.securityDeposit) || 2.5,
      utilityDeposit: Number(postData.utilityDeposit) || 0.5,
      images: (postData.imageUrls && postData.imageUrls.length > 0) 
        ? postData.imageUrls 
        : ["https://placehold.co/600x400?text=No+Image"],
      userId: postData.userId,
      agent: agentInfo,
      tacFileUrl: postData.tacFileUrl || null,
      tacFileName: postData.tacFileName || null,
      tacAnalysisText: postData.tacAnalysisText || null
    };
  } catch (error) {
    console.error("Server Error fetching property:", error);
    return null;
  }
}

const baseUrl = 'https://bilikmatch.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  const data = await getPropertyData(id);
  if (!data) return { title: "Property Not Found | Bilik Match" };

  const canonicalUrl = `${baseUrl}/${lang}/property/${id}`;

  return {
    title: `${data.condominiumName} - ${data.roomType} Room | Bilik Match`,
    description: `Rent this ${data.gender} unit at ${data.condominiumName} for RM ${data.rent}.`,
    openGraph: {
      title: `${data.condominiumName} (RM ${data.rent})`,
      url: canonicalUrl,
      images: data.images[0] ? [data.images[0]] : [],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': `${baseUrl}/en/property/${id}`,
        'en': `${baseUrl}/en/property/${id}`,
        'ja': `${baseUrl}/ja/property/${id}`,
      },
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id, lang } = await params;
  if (!id) return notFound();

  const data = await getPropertyData(id);
  if (!data) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Accommodation", // または "Apartment", "Product"
    "name": data.condominiumName,
    "description": data.description,
    "image": data.images,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kuala Lumpur", // data.location から都市名を抽出できればベスト
      "addressCountry": "MY",
      "streetAddress": data.location
    },
    "numberOfRooms": 1, // data.roomType から推測
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": 0, // 広さデータがあれば入れる
      "unitCode": "FOT" // Square Feet
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "MYR",
      "price": data.rent,
      "availability": "https://schema.org/InStock"
    }
  };

  // レビュー情報の取得
  const condoReview = await findCondoIdByName(data.condominiumName);
  const dict = await getDictionary(lang as "en" | "ja");

  // 金額計算
  const advance = data.rent;
  const security = data.rent * data.securityDeposit;
  const utility = data.rent * data.utilityDeposit;
  const total = advance + security + utility;

  const waUrl = data.agent.phoneNumber 
    ? `https://wa.me/${data.agent.phoneNumber}?text=${encodeURIComponent(`Hi ${data.agent.name}, interested in ${data.condominiumName}`)}`
    : "#";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar dict={dict} />
      <PropertyViewTracker postId={data.id} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link href={`/${lang}`} className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4" /> {dict.reviews.back_to_listings}
        </Link>

        {/* ★変更点: 新しい画像カルーセルを使用 */}
        <PropertyImageCarousel images={data.images} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Info */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2 leading-tight">{data.condominiumName}</h1>
                    <p className="flex items-center gap-2 text-zinc-500 font-medium mb-3">
                        <MapPin className="h-4 w-4 shrink-0" /> {data.location}
                    </p>
                    
                    {condoReview && (
                        <Link 
                            href={`/${lang}/reviews/${condoReview.id}`}
                            className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-yellow-100 hover:bg-yellow-100 transition-colors"
                        >
                            <Star className="h-3.5 w-3.5 fill-current" /> 
                            <span>{dict.reviews.condo_rating}: {condoReview.rating} / 5.0</span>
                            <ChevronRight className="h-3 w-3 opacity-50" />
                        </Link>
                    )}
                </div>
                <div className="text-left md:text-right shrink-0">
                    <p className="text-3xl font-black text-black">RM {data.rent}</p>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide font-bold">{dict.reviews.per_month}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-full">{data.roomType} {dict.reviews.room}</span>
                <span className="px-4 py-1.5 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-full">{data.gender} {dict.reviews.unit}</span>
              </div>
            </div>

            {/* Commute */}
            <CommuteChecker 
              propertyId={data.id} 
              propertyLocation={data.location} 
            />

            {condoReview ? (
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-yellow-50 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-black text-white rounded-xl flex items-center justify-center text-xl font-black shadow-lg">
                      {condoReview.rating}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-zinc-900">{dict.reviews.tenant_reviews}</h4>
                      <p className="text-sm text-zinc-500">{dict.reviews.see_truth_about.replace("{{name}}", data.condominiumName)}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/${lang}/reviews/${condoReview.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    {dict.reviews.read_reviews} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Description */}
            <DescriptionSection description={data.description} />

            {/* TAC & AI Analysis — click to expand inline (no navigation) */}
            {data.tacFileUrl && (
              <TacSummaryExpandable
                tacFileUrl={data.tacFileUrl}
                tacFileName={data.tacFileName}
                tacAnalysisText={data.tacAnalysisText}
                shimmerDelayMs={3000}
              />
            )}

             {/* Agent Info */}
             <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={data.agent.photo} alt={data.agent.name} className="w-14 h-14 rounded-full bg-zinc-100 object-cover border border-zinc-100" />
                    <div>
                        <p className="font-bold text-zinc-900 text-lg">{data.agent.name}</p>
                        {data.agent.verified && (
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Verified Agent
                            </p>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                {/* Cost Breakdown */}
                <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
                    <h3 className="font-bold text-xs uppercase tracking-widest mb-6 text-zinc-500">Move-in Cost</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center"><span className="text-zinc-400">First Month Rent</span><span className="font-medium">RM {advance}</span></div>
                        <div className="flex justify-between items-center"><span className="text-zinc-400">Security Deposit</span><span className="font-medium">RM {security}</span></div>
                        <div className="flex justify-between items-center"><span className="text-zinc-400">Utility Deposit</span><span className="font-medium">RM {utility}</span></div>
                        <div className="h-px bg-zinc-800 my-4"></div>
                        <div className="flex justify-between items-center text-lg"><span className="font-bold text-zinc-200">Total</span><span className="font-black text-white">RM {total}</span></div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:flex lg:flex-col lg:space-y-3">
                    <SaveButton postId={data.id} variant="desktop" />
                    <div className="grid grid-cols-2 gap-3">
                        {data.userId && (
                            <ChatButton
                                agentUserId={data.userId}
                                lang={lang}
                                postId={data.id}
                                className="flex items-center justify-center gap-2 bg-white border border-zinc-200 py-3.5 rounded-xl font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                variant="desktop"
                            />
                        )}
                        <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all shadow-sm ${data.agent.phoneNumber ? "bg-[#25D366] text-white hover:brightness-95" : "bg-zinc-300 text-zinc-500 cursor-not-allowed"}`}
                        >
                             <Phone className="h-4 w-4" /> WhatsApp
                        </a>
                    </div>
                </div>

            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 p-4 lg:hidden z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="space-y-2">
          <SaveButton postId={data.id} variant="mobile" />
          <div className="flex gap-3">
              {data.userId && (
                  <ChatButton
                      agentUserId={data.userId}
                      lang={lang}
                      postId={data.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 py-3.5 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      variant="mobile"
                  />
              )}
              <a 
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-sm active:scale-95 transition-transform ${data.agent.phoneNumber ? "bg-[#25D366] text-white" : "bg-zinc-300 text-zinc-500 cursor-not-allowed"}`}
              >
                   <Phone className="h-5 w-5" /> WhatsApp
              </a>
          </div>
        </div>
      </div>
    </div>
  );
}

