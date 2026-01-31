"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Search, User } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="hidden fixed bottom-0 left-0 z-50 w-full border-t border-zinc-200 bg-white pb-safe lg:hidden" aria-hidden="true">
      <div className="flex h-16 items-center justify-around">
        <BottomTab 
          href="/chat" 
          icon={<MessageCircle className="h-6 w-6" />} 
          label="Chat" 
          active={isActive("/chat")} 
        />
        <BottomTab 
          href="/" 
          icon={<Search className="h-6 w-6" />} 
          label="Discover" 
          active={isActive("/")} 
        />
        <BottomTab 
          href="/profile" 
          icon={<User className="h-6 w-6" />} 
          label="Profile" 
          active={isActive("/profile")} 
        />
      </div>
    </div>
  );
}

function BottomTab({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex w-full flex-col items-center justify-center py-1 transition-colors",
        active ? "text-black" : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      {/* Icon Styling */}
      <div className={clsx("mb-1", active && "scale-110 font-bold")}>
        {icon}
      </div>
      <span className={clsx("text-[10px] font-medium", active ? "font-bold" : "")}>
        {label}
      </span>
    </Link>
  );
}