// app/[lang]/property/PropertySearchContent.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Filter, Search, MapPin, Loader2, Sparkles, X, Check } from "lucide-react"; // Icons added
import Link from "next/link";
import Image from "next/image";
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
// (省略: 既存のコードと同じ)
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const getLatLng = async (address: string): Promise<{ lat: number; lng: number } | null> => {
   // (省略: 既存のコードと同じ)
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
// (省略: 既存のコードと同じ)
type AlgoliaHit = {
  objectID: string;
  condominiumName?: string;
  rent?: number;
  location?: string;
  imageUrls?: string[];
  roomType?: string;
  gender?: string;
  manualTags?: string[];
  _geoloc?: { lat: number; lng: number };
};

type Dictionary = {
    // (省略: 既存のコードと同じ)
  nav: {
    reviews: string;
    chat: string;
    profile: string;
    signin: string;
    new_badge: string;
    discover?: string;
  };
};

// ★ 新しい型定義: 心理的フィルター用
type DecisionFilter = {
    category: "essential" | "niceToHave";
    id: string;
    label: string;
};

export default function PropertySearchContent({ dict }: { dict: Dictionary }) {
  const params = useParams();
  const lang = params?.lang as string || "en";
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // ★ 既存フィルターState
  const [filters, setFilters] = useState({
    minRent: "",
    maxRent: "",
    gender: "any",
    roomType: "any",
  });

  // ★ 新規: 「80点即決フィルター」用State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // 選択された条件IDのリスト
  const [selectedEssentials, setSelectedEssentials] = useState<string[]>([]);
  const [selectedNiceToHaves, setSelectedNiceToHaves] = useState<string[]>([]);

  // ★ 定義: 選択肢
  const ESSENTIAL_OPTIONS = [
      { id: "rent_low", label: "Rent < RM 1000" },
      { id: "rent_mid", label: "Rent < RM 2000" },
      { id: "commute_short", label: "Near Station" },
      { id: "security_high", label: "High Security" },
      { id: "female_unit", label: "Female Unit" },
      { id: "private_bath", label: "Private Bath" },
  ];

  const NICE_TO_HAVE_OPTIONS = [
      { id: "gym", label: "Gym" },
      { id: "pool", label: "Swimming Pool" },
      { id: "wifi", label: "High-speed WiFi" },
      { id: "cleaning", label: "Free Cleaning" },
      { id: "view", label: "Nice View" },
  ];

  const [bannerIndex, setBannerIndex] = useState(0);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Click Outside Handler to close the smart filter
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setIsSearchFocused(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // ★ ロジック: フィルター選択制御 (必須3つ、歓迎2つまで)
  const toggleEssential = (id: string) => {
      if (selectedEssentials.includes(id)) {
          setSelectedEssentials(prev => prev.filter(item => item !== id));
      } else {
          if (selectedEssentials.length < 3) {
              setSelectedEssentials(prev => [...prev, id]);
              // ここで実際のfiltersステートも更新するロジックを入れる
              applySmartFilter(id, true);
          }
      }
  };

  const toggleNiceToHave = (id: string) => {
      if (selectedNiceToHaves.includes(id)) {
          setSelectedNiceToHaves(prev => prev.filter(item => item !== id));
      } else {
          if (selectedNiceToHaves.length < 2) {
              setSelectedNiceToHaves(prev => [...prev, id]);
          }
      }
  };

  // 簡易的にUIの選択を実際の検索フィルターに反映させるヘルパー
  const applySmartFilter = (id: string, isEssential: boolean) => {
      if (id === "rent_low") setFilters(prev => ({ ...prev, maxRent: "1000" }));
      if (id === "rent_mid") setFilters(prev => ({ ...prev, maxRent: "2000" }));
      if (id === "female_unit") setFilters(prev => ({ ...prev, gender: "Female" }));
      // 他の条件はAlgoliaのタグ検索などにマッピングする想定
  };


  // Search Execution Logic (Memoized)
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

      // ★ Nice to have tag filtering (mock logic for Algolia)
      // if (selectedNiceToHaves.includes("wifi")) filterConditions.push(`tags:wifi`);

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
  }, [searchQuery, filters, selectedNiceToHaves]); // Dependencies updated

  // Debounce
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
        
        {/* --- SIDEBAR FILTERS (Existing) --- */}
        <aside className="hidden h-[calc(100vh-8rem)] w-72 shrink-0 flex-col gap-6 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 sticky top-24 lg:flex">
           {/* (省略: 既存のサイドバー内容はそのまま) */}
           <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h3 className="font-bold uppercase tracking-wider text-sm">Filters</h3>
            <button 
              onClick={() => {
                setFilters({ minRent: "", maxRent: "", gender: "any", roomType: "any" });
                setSearchQuery("");
                setSelectedEssentials([]);
                setSelectedNiceToHaves([]);
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-black"
            >
              Reset
            </button>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Price (RM / month)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minRent}
                onChange={(e) => handleFilterChange("minRent", e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 placeholder-zinc-400 outline-none focus:border-black focus:ring-1 focus:ring-black/10"
              />
              <span className="text-zinc-400 text-sm">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxRent}
                onChange={(e) => handleFilterChange("maxRent", e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 placeholder-zinc-400 outline-none focus:border-black focus:ring-1 focus:ring-black/10"
              />
            </div>
          </div>

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
            <span className="text-xs font-bold text-zinc-400 uppercase">Gender</span>
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
        </aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1">
          
          {/* Banner (省略: 既存のコード) */}
          
          {/* Mobile filters (visible when sidebar is hidden) */}
          <div className="mb-4 flex flex-wrap items-center gap-3 lg:hidden">
            <span className="text-xs font-bold text-zinc-500 uppercase">Filters</span>
            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min RM"
                value={filters.minRent}
                onChange={(e) => handleFilterChange("minRent", e.target.value)}
                className="w-20 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 placeholder-zinc-400 outline-none focus:border-black"
              />
              <input
                type="number"
                min={0}
                placeholder="Max RM"
                value={filters.maxRent}
                onChange={(e) => handleFilterChange("maxRent", e.target.value)}
                className="w-20 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 placeholder-zinc-400 outline-none focus:border-black"
              />
              {["Any", "Single", "Middle", "Master"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFilterChange("roomType", type === "Any" ? "any" : type)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    filters.roomType === (type === "Any" ? "any" : type)
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {type}
                </button>
              ))}
              {["Any", "Male", "Female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleFilterChange("gender", g === "Any" ? "any" : g)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    filters.gender === (g === "Any" ? "any" : g)
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFilters({ minRent: "", maxRent: "", gender: "any", roomType: "any" })}
              className="text-xs font-semibold text-zinc-400 hover:text-black"
            >
              Reset
            </button>
          </div>

          {/* ==================================================================================== */}
          {/* ★ Search Bar with Psychological "80% Rule" Filter */}
          {/* ==================================================================================== */}
          <div className="mb-6 relative z-30" ref={searchContainerRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Area, University, or Station..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border-2 bg-white py-3.5 pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10 ${
                    isSearchFocused ? "rounded-t-xl border-black border-b-zinc-100" : "rounded-xl border-zinc-200"
                }`}
              />
              
              {/* Close button inside input if focused */}
              {isSearchFocused && (
                  <button 
                    onClick={() => setIsSearchFocused(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                  >
                      <X className="h-4 w-4" />
                  </button>
              )}
            </div>

            {/* ★ The "80% Rule" Dropdown Panel */}
            {isSearchFocused && (
                <div className="absolute top-full left-0 w-full bg-white border-x-2 border-b-2 border-black rounded-b-xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Concept Header */}
                    <div className="mb-6 flex items-start gap-3 rounded-lg bg-zinc-50 p-4 border border-zinc-100">
                        <div className="rounded-full bg-purple-100 p-2 text-purple-600 shrink-0">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-zinc-900 mb-1">Rule of 80%: Don't aim for perfect.</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                To avoid decision paralysis, pick only what truly matters. <br/>
                                <span className="font-semibold text-zinc-700">Max 3 Essentials</span> and <span className="font-semibold text-zinc-700">Max 2 Nice-to-haves</span>. Ignore the rest.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* 1. Essentials Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1">
                                    Essentials <span className="bg-red-50 text-red-600 px-1.5 rounded text-[10px]">{selectedEssentials.length}/3</span>
                                </h5>
                            </div>
                            <div className="space-y-2">
                                {ESSENTIAL_OPTIONS.map(opt => {
                                    const isSelected = selectedEssentials.includes(opt.id);
                                    const isDisabled = !isSelected && selectedEssentials.length >= 3;
                                    
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleEssential(opt.id)}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-bold transition-all ${
                                                isSelected 
                                                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm" 
                                                    : isDisabled 
                                                        ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed"
                                                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                                            }`}
                                        >
                                            {opt.label}
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Nice-to-haves Section */}
                        <div>
                             <div className="flex justify-between items-center mb-3">
                                <h5 className="text-xs font-black uppercase tracking-wider text-blue-500 flex items-center gap-1">
                                    Nice-to-have <span className="bg-blue-50 text-blue-600 px-1.5 rounded text-[10px]">{selectedNiceToHaves.length}/2</span>
                                </h5>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {NICE_TO_HAVE_OPTIONS.map(opt => {
                                    const isSelected = selectedNiceToHaves.includes(opt.id);
                                    const isDisabled = !isSelected && selectedNiceToHaves.length >= 2;

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleNiceToHave(opt.id)}
                                            disabled={isDisabled}
                                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                                                isSelected 
                                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" 
                                                    : isDisabled 
                                                        ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed"
                                                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-8 p-4 bg-zinc-50 rounded-xl text-center">
                                <p className="text-[10px] text-zinc-400 mb-2">Filters applied automatically</p>
                                <button 
                                    onClick={() => setIsSearchFocused(false)}
                                    className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    Search Matches
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
          </div>
          {/* ==================================================================================== */}


          {/* Results Count - Social Proof */}
          {!loading && hits.length > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
               {/* (省略: 既存のコード) */}
                <span className="font-semibold">
                  <span className="text-zinc-900 font-black">{hits.length}</span> properties found
                </span>
            </div>
          )}
          
          {/* (以下省略: Property Gridなどは既存のコードと同じ) */}
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
                 // (省略: マッピング処理)
                 const image = (hit.imageUrls && hit.imageUrls.length > 0) ? hit.imageUrls[0] : "https://placehold.co/600x400?text=No+Image";
                 return (
                    <Link href={`/${lang}/property/${hit.objectID}`} key={hit.objectID} className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white transition-all duration-300 hover:border-zinc-300 hover:shadow-2xl hover:-translate-y-1">
                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                            <Image src={image} alt={hit.condominiumName || "Property"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            {/* Price Badge */}
                            <div className="absolute right-3 top-3 rounded-lg bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-xl border border-white/50">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">From</div>
                                <div className="text-lg font-black text-black leading-tight">RM {hit.rent?.toLocaleString() || "0"}</div>
                            </div>
                        </div>
                         {/* Content */}
                         <div className="flex flex-1 flex-col p-5 space-y-3">
                            <div className="space-y-2">
                                <h3 className="line-clamp-2 text-base font-black text-zinc-900 leading-tight group-hover:text-black transition-colors">{hit.condominiumName || "Untitled Property"}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    <span className="truncate">{hit.location || "Unknown Location"}</span>
                                </div>
                            </div>
                         </div>
                    </Link>
                 );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}