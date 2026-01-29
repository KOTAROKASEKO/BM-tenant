"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Search, MapPin, Sparkles, ShieldCheck, Star } from "lucide-react";
import type { CondoListItem } from "./page";

type Dictionary = {
  reviews: {
    h1: string;
    subtitle: string;
    life_reality_filter: string;
    filter_good_mgmt: string;
    filter_japanese_staff: string;
    filter_avoid_jam: string;
    filter_no_pest: string;
    search_placeholder: string;
    overall: string;
    management: string;
    no_reviews: string;
  };
  nav: any;
};

export default function ReviewsPageContent({
  lang,
  dict,
  initialCondos,
}: {
  lang: string;
  dict: Dictionary;
  initialCondos: CondoListItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const condos = useMemo(() => {
    if (!searchQuery.trim()) return initialCondos;
    const q = searchQuery.toLowerCase().trim();
    return initialCondos.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }, [initialCondos, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar dict={dict} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-zinc-900 mb-2">{dict.reviews.h1}</h1>
          <p className="text-zinc-500">{dict.reviews.subtitle}</p>
        </div>

        {/* --- Life Reality Filter --- */}
        <div className="mb-8 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {dict.reviews.life_reality_filter}
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {[
              { label: dict.reviews.filter_good_mgmt, icon: <ShieldCheck className="h-4 w-4" /> },
              { label: dict.reviews.filter_japanese_staff, icon: <span className="text-xs font-bold">JP</span> },
              { label: dict.reviews.filter_avoid_jam, icon: <MapPin className="h-4 w-4" /> },
              { label: dict.reviews.filter_no_pest, icon: <Sparkles className="h-4 w-4" /> },
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
            placeholder={dict.reviews.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-4 pl-12 pr-4 text-base font-medium shadow-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        {/* Condo List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {condos.map((condo) => (
            <Link
              href={`/${lang}/reviews/${condo.id}`}
              key={condo.id}
              className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="flex h-44">
                {/* Image */}
                <div className="w-1/3 bg-zinc-200 relative">
                  <img
                    src={condo.imageUrl}
                    alt={condo.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 leading-tight group-hover:underline line-clamp-1">
                      {condo.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {condo.location || "Location not available"}
                    </p>

                    {/* Tags from Firestore */}
                    <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-hidden">
                      {condo.tags.slice(0, 4).map((tag, i) => (
                        <span
                          key={`${condo.id}-tag-${i}`}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            tag.type === "negative"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {tag.type === "negative" && "⚠️ "}
                          {tag.label}
                          {tag.count != null && tag.count > 0 && (
                            <span className="ml-1 opacity-80">×{tag.count}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-4 text-xs font-bold border-t border-zinc-100 pt-2">
                    <div className="flex items-center gap-1 text-zinc-700">
                      <span>{dict.reviews.overall}</span>
                      <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                        <Star className="h-2 w-2 fill-current" /> {condo.rating.overall}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <span>{dict.reviews.management}</span>
                      <span
                        className={
                          condo.rating.management >= 4 ? "text-emerald-600" : "text-red-500"
                        }
                      >
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
              <p>{dict.reviews.no_reviews}</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
