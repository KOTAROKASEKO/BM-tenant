"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Filter, Search, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { liteClient as algoliasearch } from "algoliasearch/lite";

// 1. Initialize Client
const searchClient = algoliasearch(
  "86BOLZBS9Q",
  "5da01cabd95ead996a8c0002b09c4b63"
);

// 2. Google Maps API Setup
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Helper: Geocode Address to Lat/Lng
const getLatLng = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  console.log("Geocoding address:", address);
  if (!address || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await res.json();
    console.log("Geocoding response", data);
    if (data.status === "OK" && data.results[0]) {
      console.log("Geocoding result", data.results[0].geometry.location);
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
};

// 3. Define Data Shape
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

export default function HomePage() {
  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    minRent: "",
    maxRent: "",
    gender: "any",
    roomType: "any",
  });

  // 4. Search Logic
  const performSearch = useCallback(async () => {
    setLoading(true);

    try {
      // --- A. PREPARE LOCATION ---
      let targetLatLng = "3.1579, 101.7116"; // Default: KLCC
      let targetRadius: string | number = 20000; // Default: 20km
      let finalQueryText = searchQuery;
      let useGeoSearch = false;

      // If user typed something, try to interpret it as a location first
      if (searchQuery.trim()) {
        const coords = await getLatLng(searchQuery);
        
        if (coords) {
          // Case 1: Geocoding Successful (e.g., "Bukit Jalil LRT")
          targetLatLng = `${coords.lat}, ${coords.lng}`;
          targetRadius = 5000; // Search within 5km of the found place
          finalQueryText = ""; // Clear text to show ALL properties near this location
          useGeoSearch = true;
        } else {
          // Case 2: Geocoding Failed (e.g., "Master Room") -> Text Search
          useGeoSearch = false;
        }
      } else {
        // Case 3: No Input -> Default View (KLCC)
        useGeoSearch = true;
        targetRadius = "all"; 
      }

      // --- B. PREPARE FILTERS ---
      const filterConditions = [];
      const min = parseInt(filters.minRent) || 0;
      const max = parseInt(filters.maxRent) || 5000;
      
      if (min > 0) filterConditions.push(`rent >= ${min}`);
      if (max < 5000) filterConditions.push(`rent <= ${max}`);
      if (filters.gender !== "any") filterConditions.push(`gender:${filters.gender}`);
      if (filters.roomType !== "any") filterConditions.push(`roomType:${filters.roomType}`);

      const filterString = filterConditions.join(" AND ");

      // --- C. EXECUTE SEARCH ---
      const searchParams: any = {
        indexName: "bilik_match_index",
        query: finalQueryText,
        hitsPerPage: 20,
        filters: filterString,
      };

      // Only apply geo-parameters if we are doing a location-based search
      if (useGeoSearch) {
        searchParams.aroundLatLng = targetLatLng;
        searchParams.aroundRadius = targetRadius;
        // This ensures the results are sorted by distance from the targetLatLng
      }

      const response = await searchClient.search({
        requests: [searchParams],
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

  // 5. Trigger Search (Debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500); // Increased debounce slightly to allow typing to finish before geocoding
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Navbar />

      <main className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="hidden h-[calc(100vh-8rem)] w-72 shrink-0 flex-col gap-6 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 sticky top-24 lg:flex">
          {/* ... (Existing Filter UI Code remains exactly the same) ... */}
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

          <Link href="/ai-chat" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800">
             Ask AI Assistant
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
          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="search with city, LRT, University, any place..."
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
                    href={`/property/${hit.objectID}`} 
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