"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { MapPin, User, CheckCircle2, MessageCircle, Phone, ArrowLeft, Bus, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the shape of our data
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
  agent: AgentProfile;
};

export default function PropertyDetailPage() {
  // Unwraps the Promise for params in Next.js 15+ (if applicable), 
  // or works as a standard hook in older versions.
  const params = useParams(); 
  const propertyId = params?.id as string;

  const [data, setData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        // 1. Fetch Property Data
        const docRef = doc(db, "posts", propertyId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Property not found.");
          setLoading(false);
          return;
        }

        const postData = docSnap.data();

        // 2. Fetch Agent Data (if userId exists)
        let agentInfo: AgentProfile = {
          name: "Unknown Agent",
          verified: false,
          photo: "https://ui-avatars.com/api/?name=Agent",
        };

        if (postData.userId) {
          try {
            const userRef = doc(db, "users_prof", postData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
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

        // 3. Set Complete Data
        setData({
          id: docSnap.id,
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
          agent: agentInfo
        });

      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // --- Actions ---
  const handleWhatsApp = () => {
    if (!data?.agent.phoneNumber) {
      alert("No phone number available for this agent.");
      return;
    }
    const message = `Hi ${data.agent.name}, I'm interested in ${data.condominiumName}. Is it still available?`;
    const url = `https://wa.me/${data.agent.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm font-medium">Loading details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center max-w-md">
          <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Oops!</h2>
          <p className="text-zinc-500 mb-6">{error || "Something went wrong."}</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculations
  const advance = data.rent;
  const security = data.rent * data.securityDeposit;
  const utility = data.rent * data.utilityDeposit;
  const total = advance + security + utility;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24 md:pb-0">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 h-[300px] md:h-[400px] overflow-hidden rounded-2xl shadow-sm border border-zinc-100">
          <div className="h-full bg-zinc-200 relative group cursor-pointer">
            <img src={data.images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
            <div className="bg-zinc-200 relative overflow-hidden group cursor-pointer">
               <img src={data.images[1] || data.images[0]} alt="Sub" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm font-bold hover:bg-zinc-200 transition-colors cursor-pointer">
              View All Photos
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2 leading-tight">{data.condominiumName}</h1>
                    <p className="flex items-center gap-2 text-zinc-500 font-medium">
                        <MapPin className="h-4 w-4 shrink-0" /> {data.location}
                    </p>
                </div>
                <div className="text-left md:text-right shrink-0 bg-zinc-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none w-full md:w-auto">
                    <p className="text-3xl font-black text-black">RM {data.rent}</p>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide font-bold">Per Month</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-full">{data.roomType} Room</span>
                <span className="px-4 py-1.5 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-full">{data.gender} Unit</span>
              </div>
            </div>

            {/* Commute (Placeholder) */}
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm shrink-0">
                    <Bus className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm uppercase text-blue-900 mb-1">Commute Check</h4>
                    <p className="text-sm text-blue-700/80 leading-relaxed">
                        Login to automatically calculate travel time from this property to your workplace.
                    </p>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-zinc-900">About this property</h3>
                <p className="whitespace-pre-line text-zinc-600 leading-relaxed text-sm md:text-base">
                    {data.description}
                </p>
            </div>

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
                <button className="hidden md:flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-sm font-bold transition-colors">
                    View Profile
                </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Costs & Sticky Action */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                
                {/* Cost Breakdown */}
                <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
                    <h3 className="font-bold text-xs uppercase tracking-widest mb-6 text-zinc-500">Move-in Cost</h3>
                    
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
                            <span className="font-bold text-zinc-200">Total Required</span>
                            <span className="font-black text-white">RM {total}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 py-3.5 rounded-xl font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-800">
                         <MessageCircle className="h-4 w-4" /> Chat
                    </button>
                    <button 
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-xl font-bold hover:brightness-95 transition-all shadow-sm"
                    >
                         <Phone className="h-4 w-4" /> WhatsApp
                    </button>
                </div>

            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 p-4 lg:hidden z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 py-3.5 rounded-xl font-bold active:scale-95 transition-transform">
                 <MessageCircle className="h-5 w-5" /> Chat
            </button>
            <button 
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-xl font-bold shadow-sm active:scale-95 transition-transform"
            >
                 <Phone className="h-5 w-5" /> WhatsApp
            </button>
        </div>
      </div>
    </div>
  );
}