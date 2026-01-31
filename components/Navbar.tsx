"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { User, MessageCircle, Loader2, Menu, X, Star, Home } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const lang = mounted ? ((params?.lang as string) || "en") : "en";
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;
  const isDiscover = pathname === `/${lang}` || pathname === `/${lang}/`;

  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <>
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
          {/* Desktop: Show all buttons */}
          <div className="hidden md:flex items-center gap-3">
          {!mounted || loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
          ) : (
            <>
              {/* Condo Reviews Button - Always visible */}
              <Link href={`/${lang}/reviews`}>
                <button 
                  className={clsx(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    isActive(`/${lang}/reviews`)
                      ? "border-black bg-black text-white" 
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  {dict.nav.reviews}
                  <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{dict.nav.new_badge}</span>
                </button>
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

          {/* Mobile: Show menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-zinc-900" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={clsx(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeDrawer}
        />

        {/* Drawer Panel */}
        <div
          className={clsx(
            "absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-out",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h2 className="text-lg font-bold text-zinc-900">Menu</h2>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-zinc-600" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!mounted || loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
                </div>
              ) : (
                <>
                  {/* Home / Discover */}
                  <Link href={`/${lang}`} onClick={closeDrawer}>
                    <div
                      className={clsx(
                        "flex items-center gap-3 p-4 rounded-xl transition-all",
                        isDiscover
                          ? "bg-black text-white"
                          : "bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                      )}
                    >
                      <Home className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-semibold">{dict.nav.discover ?? "Discover"}</div>
                        <div className="text-xs opacity-70">Home · Search & AI room finder</div>
                      </div>
                    </div>
                  </Link>

                  {/* Condominium Reviews */}
                  <Link href={`/${lang}/reviews`} onClick={closeDrawer}>
                    <div
                      className={clsx(
                        "flex items-center gap-3 p-4 rounded-xl transition-all",
                        isActive(`/${lang}/reviews`)
                          ? "bg-black text-white"
                          : "bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                      )}
                    >
                      <Star className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-semibold">{dict.nav.reviews}</div>
                        <div className="text-xs opacity-70">View condominium reviews</div>
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-bold">
                        {dict.nav.new_badge}
                      </span>
                    </div>
                  </Link>

                  {user ? (
                    <>
                      {/* Chat */}
                      <Link href={`/${lang}/chat`} onClick={closeDrawer}>
                        <div
                          className={clsx(
                            "flex items-center gap-3 p-4 rounded-xl transition-all",
                            isActive(`/${lang}/chat`)
                              ? "bg-black text-white"
                              : "bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                          )}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="font-semibold">{dict.nav.chat}</div>
                            <div className="text-xs opacity-70">View your messages</div>
                          </div>
                        </div>
                      </Link>

                      {/* Profile */}
                      <Link href={`/${lang}/profile`} onClick={closeDrawer}>
                        <div
                          className={clsx(
                            "flex items-center gap-3 p-4 rounded-xl transition-all",
                            isActive(`/${lang}/profile`)
                              ? "bg-black text-white"
                              : "bg-zinc-50 text-zinc-900 hover:bg-zinc-100"
                          )}
                        >
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">{dict.nav.profile}</div>
                            <div className="text-xs opacity-70">Manage your account</div>
                          </div>
                        </div>
                      </Link>
                    </>
                  ) : (
                      /* Sign In */
                      <Link href={`/${lang}/signin`} onClick={closeDrawer}>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-black text-white hover:bg-zinc-800 transition-all">
                          <User className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="font-semibold">{dict.nav.signin}</div>
                            <div className="text-xs opacity-70">Sign in to your account</div>
                          </div>
                        </div>
                      </Link>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}