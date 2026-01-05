"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { MapPin, User, CheckCircle2, MessageCircle, Phone, ArrowLeft, Bus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock Data for Detail
const PROPERTY_DATA = {
  id: "1",
  condominiumName: "Luxury Condo @ KLCC",
  location: "Jalan Ampang, 50450 Kuala Lumpur",
  rent: 1200,
  description: "Beautiful fully furnished room with a stunning view of the twin towers. Comes with high-speed wifi and weekly cleaning.\n\nLooking for a clean and responsible tenant.",
  roomType: "Master",
  gender: "Mix",
  securityDeposit: 2.0,
  utilityDeposit: 0.5,
  images: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  ],
  agent: {
    name: "Sarah Jenkins",
    verified: true,
    photo: "https://i.pravatar.cc/150?u=sarah",
  },
};

export default function PropertyDetailPage() {
  const params = useParams();
  const [data, setData] = useState<typeof PROPERTY_DATA | null>(null);

  // Simulate Fetching
  useEffect(() => {
    // In real app: fetch(params.id) from Firebase/Algolia
    setData(PROPERTY_DATA);
  }, [params.id]);

  if (!data) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;

  // Deposit Logic
  const advance = data.rent;
  const security = data.rent * data.securityDeposit;
  const utility = data.rent * data.utilityDeposit;
  const total = advance + security + utility;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24 md:pb-0">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <Link href="/property-list" className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        {/* Gallery Grid (Modern) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 h-[400px] overflow-hidden rounded-2xl">
          <div className="h-full bg-zinc-200 relative">
            <img src={data.images[0]} alt="Main" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
            <div className="bg-zinc-200 relative">
               <img src={data.images[1] || data.images[0]} alt="Sub" className="w-full h-full object-cover" />
            </div>
            <div className="bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm font-medium">
              + More Photos
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">{data.condominiumName}</h1>
                    <p className="flex items-center gap-2 text-zinc-500 text-sm">
                        <MapPin className="h-4 w-4" /> {data.location}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-black">RM {data.rent}</p>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide">Per Month</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">{data.roomType} Room</span>
                <span className="px-3 py-1 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-full">{data.gender} Unit</span>
              </div>
            </div>

            {/* Commute Placeholder */}
            <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200 flex items-start gap-4">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 shadow-sm">
                    <Bus className="h-5 w-5 text-black" />
                </div>
                <div>
                    <h4 className="font-bold text-sm uppercase text-zinc-900 mb-1">Commute Check</h4>
                    <p className="text-sm text-zinc-500">
                        Sign in to calculate travel time to your workplace automatically.
                    </p>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-zinc-900">About this property</h3>
                <p className="whitespace-pre-line text-zinc-600 leading-relaxed text-sm">
                    {data.description}
                </p>
            </div>

             {/* Agent Info */}
             <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={data.agent.photo} className="w-12 h-12 rounded-full bg-zinc-100 object-cover border border-zinc-100" />
                    <div>
                        <p className="font-bold text-zinc-900">{data.agent.name}</p>
                        {data.agent.verified && (
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Verified Agent
                            </p>
                        )}
                    </div>
                </div>
                <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-sm font-semibold transition">
                    View Profile
                </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Costs & Sticky Action */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                
                {/* Cost Breakdown */}
                <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-zinc-400">Move-in Cost</h3>
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400">First Month Rent</span>
                            <span className="font-medium">RM {advance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Security Deposit ({data.securityDeposit} mo)</span>
                            <span className="font-medium">RM {security}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Utility Deposit ({data.utilityDeposit} mo)</span>
                            <span className="font-medium">RM {utility}</span>
                        </div>
                        
                        <div className="h-px bg-zinc-800 my-4"></div>
                        
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold">Total Required</span>
                            <span className="font-black">RM {total}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 py-3 rounded-xl font-bold hover:bg-zinc-50 transition">
                         <MessageCircle className="h-4 w-4" /> Chat
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold hover:brightness-90 transition shadow-sm">
                         <Phone className="h-4 w-4" /> WhatsApp
                    </button>
                </div>

            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 p-4 lg:hidden z-50 pb-safe">
        <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 py-3 rounded-xl font-bold">
                 <MessageCircle className="h-5 w-5" /> Chat
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold shadow-sm">
                 <Phone className="h-5 w-5" /> WhatsApp
            </button>
        </div>
      </div>
    </div>
  );
}