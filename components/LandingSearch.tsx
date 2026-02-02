"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Search, Sparkles, X } from "lucide-react";

type Option = { id: string; label: string };

const ESSENTIAL_OPTIONS: Option[] = [
  { id: "rent_low", label: "Rent < RM 1000" },
  { id: "rent_mid", label: "Rent < RM 2000" },
  { id: "commute_short", label: "Near Station" },
  { id: "security_high", label: "High Security" },
  { id: "female_unit", label: "Female Unit" },
  { id: "private_bath", label: "Private Bath" },
];

const NICE_TO_HAVE_OPTIONS: Option[] = [
  { id: "gym", label: "Gym" },
  { id: "pool", label: "Swimming Pool" },
  { id: "wifi", label: "High-speed WiFi" },
  { id: "cleaning", label: "Free Cleaning" },
  { id: "view", label: "Nice View" },
];

export default function LandingSearch({
  placeholder,
  action,
}: {
  placeholder: string;
  action: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEssentials, setSelectedEssentials] = useState<string[]>([]);
  const [selectedNiceToHaves, setSelectedNiceToHaves] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleEssential = (id: string) => {
    if (selectedEssentials.includes(id)) {
      setSelectedEssentials((prev) => prev.filter((item) => item !== id));
      return;
    }
    if (selectedEssentials.length < 3) {
      setSelectedEssentials((prev) => [...prev, id]);
    }
  };

  const toggleNiceToHave = (id: string) => {
    if (selectedNiceToHaves.includes(id)) {
      setSelectedNiceToHaves((prev) => prev.filter((item) => item !== id));
      return;
    }
    if (selectedNiceToHaves.length < 2) {
      setSelectedNiceToHaves((prev) => [...prev, id]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <form action={action} method="GET" className="relative">
        <Search className="absolute left-6 h-6 w-6 text-zinc-400 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          name="q"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          className={`h-16 w-full rounded-2xl bg-white pl-16 pr-12 text-lg outline-none placeholder:text-zinc-400 border-2 shadow-lg transition ${
            isOpen ? "border-black border-b-zinc-100 rounded-b-none" : "border-zinc-200 hover:border-indigo-300 hover:shadow-xl"
          }`}
        />
        <input type="hidden" name="essentials" value={selectedEssentials.join(",")} />
        <input type="hidden" name="nice" value={selectedNiceToHaves.join(",")} />
        {isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-x-2 border-b-2 border-black rounded-b-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-30">
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-zinc-50 p-4 border border-zinc-100">
              <div className="rounded-full bg-purple-100 p-2 text-purple-600 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 mb-1">Rule of 80%: Don&apos;t aim for perfect.</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Choose only what truly matters.{" "}
                  <span className="font-semibold text-zinc-700">Max 3 Essentials</span> and{" "}
                  <span className="font-semibold text-zinc-700">Max 2 Nice-to-haves</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1">
                    Essentials{" "}
                    <span className="bg-red-50 text-red-600 px-1.5 rounded text-[10px]">
                      {selectedEssentials.length}/3
                    </span>
                  </h5>
                </div>
                <div className="space-y-2">
                  {ESSENTIAL_OPTIONS.map((opt) => {
                    const isSelected = selectedEssentials.includes(opt.id);
                    const isDisabled = !isSelected && selectedEssentials.length >= 3;
                    return (
                      <button
                        key={opt.id}
                        type="button"
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

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-blue-500 flex items-center gap-1">
                    Nice-to-have{" "}
                    <span className="bg-blue-50 text-blue-600 px-1.5 rounded text-[10px]">
                      {selectedNiceToHaves.length}/2
                    </span>
                  </h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NICE_TO_HAVE_OPTIONS.map((opt) => {
                    const isSelected = selectedNiceToHaves.includes(opt.id);
                    const isDisabled = !isSelected && selectedNiceToHaves.length >= 2;
                    return (
                      <button
                        key={opt.id}
                        type="button"
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
                    type="submit"
                    onClick={() => setIsOpen(false)}
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
      </form>

    </div>
  );
}
