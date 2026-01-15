import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Search, MapPin, Sparkles, ShieldCheck, Star } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";

export const metadata = {
  title: "Condo Reviews | Bilik Match",
  description: "Discover the real living experience. Check management quality and hidden issues before you rent.",
};

// --- Type Definition ---
type CondoData = {
  id: string;
  name: string;
  location: string;
  rating: {
    overall: number;
    management: number;
  };
  tags: { label: string; type: "positive" | "negative" }[];
  imageUrl: string;
};

// --- Fetch Function ---
async function getAllCondos(): Promise<CondoData[]> {
  try {
    const snapshot = await adminDb.collection("condominiums").get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Unknown",
        location: data.location || "",
        rating: {
          overall: data.rating?.overall || 0,
          management: data.rating?.management || 0,
        },
        tags: data.tags || [],
        imageUrl: data.imageUrl || "https://placehold.co/600x400?text=No+Image",
      };
    });
  } catch (error) {
    console.error("Error fetching condos:", error);
    return [];
  }
}

export default async function ReviewsPage() {
  const condos = await getAllCondos();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-zinc-900 mb-2">Condo Reviews</h1>
          <p className="text-zinc-500">Don't just rely on specs. Check the "Life Reality".</p>
        </div>

        {/* --- Life Reality Filter --- */}
        <div className="mb-8 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Life Reality Filter
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Good Management (Old but Gold)", icon: <ShieldCheck className="h-4 w-4" /> },
              { label: "Japanese Staff Available", icon: <span className="text-xs font-bold">JP</span> },
              { label: "Avoid Traffic Jam", icon: <MapPin className="h-4 w-4" /> },
              { label: "No Pest Issues", icon: <Sparkles className="h-4 w-4" /> },
            ].map((filter, i) => (
              <button 
                key={i}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-600 hover:border-black hover:bg-black hover:text-white transition-all active:scale-95"
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Condo Name..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-4 pl-12 pr-4 text-base font-medium shadow-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        {/* Condo List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {condos.map((condo) => (
            <Link href={`/reviews/${condo.id}`} key={condo.id} className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="flex h-44">
                {/* Image */}
                <div className="w-1/3 bg-zinc-200 relative">
                  <img src={condo.imageUrl} alt={condo.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Content */}
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 leading-tight group-hover:underline line-clamp-1">{condo.name}</h3>
                    <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {condo.location}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-hidden">
                      {condo.tags.slice(0, 3).map((tag, i) => (
                        <span 
                          key={i} 
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            tag.type === 'negative' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : 'bg-green-50 text-green-600 border-green-100'
                          }`}
                        >
                          {tag.type === 'negative' && '⚠️ '}{tag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-4 text-xs font-bold border-t border-zinc-100 pt-2">
                    <div className="flex items-center gap-1 text-zinc-700">
                      <span>Overall</span>
                      <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                        <Star className="h-2 w-2 fill-current" /> {condo.rating.overall}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <span>Management</span>
                      <span className={`${condo.rating.management >= 4 ? 'text-green-600' : 'text-red-500'}`}>
                        {condo.rating.management}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {condos.length === 0 && (
             <div className="col-span-full py-10 text-center text-zinc-400">
                <p>No reviews found. Try uploading some data!</p>
             </div>
          )}
        </div>

      </main>
    </div>
  );
}