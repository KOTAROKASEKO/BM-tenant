"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Filter, Search, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

// Mock Data Type (Replace with your Algolia/Firebase Type)
type Property = {
  id: string;
  title: string;
  price: number;
  location: string;
  image: string;
  type: string;
  gender: "Male" | "Female" | "Mix";
};

// Mock Data
const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Luxury Condo @ KLCC",
    price: 1200,
    location: "Kuala Lumpur City Centre",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    type: "Master",
    gender: "Mix",
  },
  {
    id: "2",
    title: "Cozy Room near Sunway",
    price: 850,
    location: "Bandar Sunway, Selangor",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    type: "Middle",
    gender: "Female",
  },
  {
    id: "3",
    title: "Single Room - Pavilion",
    price: 600,
    location: "Bukit Bintang",
    image: "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80",
    type: "Single",
    gender: "Male",
  },
];

export default function PropertyListPage() {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minRent: "",
    maxRent: "",
    gender: "any",
    roomType: "any",
  });

  // Handle Search/Filter Logic here (Algolia)
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // triggerSearch()
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Navbar />

      <main className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden h-[calc(100vh-8rem)] w-72 shrink-0 flex-col gap-6 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 sticky top-24 lg:flex">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h3 className="font-bold uppercase tracking-wider text-sm">Filters</h3>
            <button className="text-xs font-semibold text-zinc-400 hover:text-black">
              Reset
            </button>
          </div>

          {/* AI CTA */}
          <Link href="/ai-chat" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800">
             Ask AI Assistant
          </Link>

          {/* Availability */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Move-in Date</span>
            <input type="date" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-black" />
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
                    value={type.toLowerCase()}
                    onChange={(e) => handleFilterChange("roomType", e.target.value)}
                  />
                  <span className="block rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-all peer-checked:bg-black peer-checked:text-white hover:border-black">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase">Monthly Rent (RM)</span>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-black" />
              <span className="text-zinc-300">-</span>
              <input type="number" placeholder="Max" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by location, condo name..."
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {MOCK_PROPERTIES.map((post) => (
              <Link
                href={`/property-list/${post.id}`}
                key={post.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {post.type} Room
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 group-hover:underline">
                      {post.title}
                    </h3>
                    <span className="shrink-0 text-sm font-black text-black">
                      RM {post.price}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{post.location}</span>
                  </div>

                  <div className="mt-auto flex items-center gap-2 border-t border-zinc-100 pt-3">
                    <span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                      {post.gender} Unit
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State Mock */}
          {MOCK_PROPERTIES.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 p-4">
                <Filter className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold">No results found</h3>
              <p className="text-sm text-zinc-500">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}