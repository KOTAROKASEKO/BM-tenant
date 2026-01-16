"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Filter, Search, MapPin, Loader2, Sparkles, UserPlus, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// --- 1. Initialize Client ---
const searchClient = algoliasearch(
  "86BOLZBS9Q",
  "5da01cabd95ead996a8c0002b09c4b63"
);

// --- 2. Google Maps API Setup ---
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const getLatLng = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.status === "OK" && data.results[0]) {
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
};

// --- 3. Define Data Shape ---
type AlgoliaHit = {
  objectID: string;
  condominiumName?: string;
  rent?: number;
  location?: string;
  imageUrls?: string[];
  roomType?: string;
  gender?: string;
  _geoloc?: { lat: number; lng: number };
};

// --- 4. Search Logic Component ---
export default function PropertySearchContent({ dict }: { dict: any }) {
  const params = useParams();
  const lang = params?.lang as string || "en";
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  const [filters, setFilters] = useState({
    minRent: "",
    maxRent: "",
    gender: "any",
    roomType: "any",
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Search Execution Logic
  const performSearch = useCallback(async () => {
    setLoading(true);

    try {
      let targetLatLng = "3.1579, 101.7116"; 
      let targetRadius: string | number = 20000; 
      let finalQueryText = searchQuery;
      let useGeoSearch = false;

      if (searchQuery.trim()) {
        const coords = await getLatLng(searchQuery);
        if (coords) {
          targetLatLng = `${coords.lat}, ${coords.lng}`;
          targetRadius = 5000;
          finalQueryText = ""; 
          useGeoSearch = true;
        } else {
          useGeoSearch = false;
        }
      } else {
        useGeoSearch = true;
        targetRadius = "all"; 
      }

      const filterConditions = [];
      const min = parseInt(filters.minRent) || 0;
      const max = parseInt(filters.maxRent) || 5000;
      
      if (min > 0) filterConditions.push(`rent >= ${min}`);
      if (max < 5000) filterConditions.push(`rent <= ${max}`);
      if (filters.gender !== "any") filterConditions.push(`gender:${filters.gender}`);
      if (filters.roomType !== "any") filterConditions.push(`roomType:${filters.roomType}`);

      const filterString = filterConditions.join(" AND ");

      const searchParamsAlgolia: any = {
        indexName: "bilik_match_index",
        query: finalQueryText,
        hitsPerPage: 20,
        filters: filterString,
      };

      if (useGeoSearch) {
        searchParamsAlgolia.aroundLatLng = targetLatLng;
        searchParamsAlgolia.aroundRadius = targetRadius;
      }

      const response = await searchClient.search({
        requests: [searchParamsAlgolia],
      });

      if (response.results && response.results[0]) {
        // @ts-ignore
        setHits(response.results[0].hits as AlgoliaHit[]);
      }

    } catch (error) {
      console.error("Algolia search error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500); 
    return () => clearTimeout(timeoutId);
  }, [performSearch, searchQuery, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 lg:pb-0">
      
      <Navbar dict={dict} />

      <main className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="hidden h-[calc(100vh-8rem)] w-72 shrink-0 flex-col gap-6 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 sticky top-24 lg:flex">
           <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h3 className="font-bold uppercase tracking-wider text-sm">Filters</h3>
            <button 
              onClick={() => {
                setFilters({ minRent: "", maxRent: "", gender: "any", roomType: "any" });
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-black"
            >
              Reset
            </button>
          </div>

          <Link href={`/${lang}/ai-chat`} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800">
             <Sparkles className="h-4 w-4 text-purple-400" /> Ask AI Assistant
          </Link>

          {/* Room Type */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Room Type</span>
            <div className="flex flex-wrap gap-2">
              {["Any", "Single", "Middle", "Master"].map((type) => (
                <label key={type} className="cursor-pointer">
                  <input
                    type="radio"
                    name="roomType"
                    className="peer hidden"
                    value={type === "Any" ? "any" : type}
                    checked={filters.roomType === (type === "Any" ? "any" : type)}
                    onChange={(e) => handleFilterChange("roomType", e.target.value)}
                  />
                  <span className="block rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-all peer-checked:bg-black peer-checked:text-white hover:border-black">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Gender Preference</span>
            <div className="flex flex-wrap gap-2">
              {["Any", "Male", "Female"].map((g) => (
                <label key={g} className="cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    className="peer hidden"
                    value={g === "Any" ? "any" : g}
                    checked={filters.gender === (g === "Any" ? "any" : g)}
                    onChange={(e) => handleFilterChange("gender", e.target.value)}
                  />
                  <span className="block rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-all peer-checked:bg-black peer-checked:text-white hover:border-black">
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Monthly Rent (RM)</span>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                value={filters.minRent}
                onChange={(e) => handleFilterChange("minRent", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-black" 
              />
              <span className="text-zinc-300">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={filters.maxRent}
                onChange={(e) => handleFilterChange("maxRent", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-black" 
              />
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1">
          
          {/* Conversational Benefit Banner (Only if NOT logged in) */}
          {!user && !authLoading && (
            <div className="mb-8 overflow-hidden rounded-3xl bg-black p-6 text-white shadow-xl md:p-8 relative group">
                <div className="absolute top-0 right-0 p-32 bg-purple-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-xl">
                        <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-xs">
                            <MessageCircle className="h-4 w-4" />
                            <span>Efficiency Hack</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight md:text-3xl">
                            Don't just search. Let agents <br className="hidden md:block"/> come to <span className="text-purple-400 underline decoration-wavy decoration-purple-400/30 underline-offset-4">you</span>.
                        </h2>
                        <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                            Instead of endless scrolling, create a profile. Agents with your <b>ideal property</b> will talk to you directly. This conversational way to find a property makes room hunting 10x more efficient.
                        </p>
                    </div>
                    <Link 
                        href={`/${lang}/signup`} 
                        className="shrink-0 whitespace-nowrap rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group-hover:shadow-white/20"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create Free Profile
                    </Link>
                </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search with city, LRT, University, or any place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
            </div>
          )}

          {/* Property Grid */}
          {!loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {hits.map((hit) => {
                const image = (hit.imageUrls && hit.imageUrls.length > 0) 
                  ? hit.imageUrls[0] 
                  : "https://placehold.co/600x400?text=No+Image";

                return (
                  <Link
                    href={`/${lang}/property/${hit.objectID}`} 
                    key={hit.objectID}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                      <img
                        src={image}
                        alt={hit.condominiumName || "Property"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        {hit.roomType || "Room"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 group-hover:underline">
                          {hit.condominiumName || "Untitled Property"}
                        </h3>
                        <span className="shrink-0 text-sm font-black text-black">
                          RM {hit.rent}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{hit.location || "Unknown Location"}</span>
                      </div>

                      <div className="mt-auto flex items-center gap-2 border-t border-zinc-100 pt-3">
                        <span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                          {hit.gender || "Mix"} Unit
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && hits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 p-4">
                <Filter className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold">No results found</h3>
              <p className="text-sm text-zinc-500">Try adjusting your filters or search for a general location.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}