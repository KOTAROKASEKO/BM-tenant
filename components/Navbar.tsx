"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { User, MessageCircle, Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import clsx from "clsx";

type Dictionary = {
  nav: {
    reviews: string;
    chat: string;
    profile: string;
    signin: string;
    new_badge: string;
    discover?: string;
  }
};

export default function Navbar({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        
        {/* --- LEFT: Logo --- */}
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <span className="font-bold">B</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            BilikMatch
          </span>
        </Link>

        {/* --- CENTER: Blank (Spacer) --- */}
        <div className="hidden md:block flex-1" />

        {/* --- RIGHT: Actions --- */}
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
          ) : (
            <>
              {/* Condo Reviews Button - Always visible */}
              <Link 
                href={`/${lang}/reviews`} 
                className={`text-sm font-bold transition-colors ${isActive(`/${lang}/reviews`) ? 'text-black' : 'text-zinc-500 hover:text-black'}`}
              >
                {dict.nav.reviews}
                <span className="ml-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{dict.nav.new_badge}</span>
              </Link>

              {user ? (
                <>
                  {/* Chat Button */}
                  <Link href={`/${lang}/chat`}>
                    <button 
                      className={clsx(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                        isActive(`/${lang}/chat`)
                          ? "border-black bg-black text-white" 
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{dict.nav.chat}</span>
                    </button>
                  </Link>

                  {/* Profile Button */}
                  <Link href={`/${lang}/profile`}>
                    <button 
                      className={clsx(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                        isActive(`/${lang}/profile`)
                          ? "border-black bg-zinc-100 text-black shadow-inner"
                          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:shadow-sm"
                      )}
                    >
                      
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span>{dict.nav.profile}</span>
                    </button>
                  </Link>
                </>
              ) : (
                // Signed Out State
                <Link href={`/${lang}/signin`}>
                  <button className="flex items-center gap-2 rounded-full border border-zinc-200 bg-black px-5 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:shadow-md">
                    <User className="h-4 w-4" />
                    <span>{dict.nav.signin}</span>
                  </button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}