"use client";

import { useState, useEffect } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { toggleSavePost, isPostSaved } from "@/lib/saved-posts";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

type SaveButtonProps = {
  postId: string;
  className?: string;
  variant?: "desktop" | "mobile";
  onSaveChange?: (isSaved: boolean) => void;
};

export default function SaveButton({ postId, className, variant = "desktop", onSaveChange }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const saved = await isPostSaved(postId);
          setIsSaved(saved);
        } catch (error) {
          console.error("Error checking save status:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/signin");
      return;
    }

    setSaving(true);
    try {
      const newSavedState = await toggleSavePost(postId);
      setIsSaved(newSavedState);
      onSaveChange?.(newSavedState);
    } catch (error: any) {
      console.error("Error toggling save:", error);
      alert(error.message || "Failed to save post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 ${className || ""} opacity-50 cursor-not-allowed`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </button>
    );
  }

  const baseClasses = variant === "mobile"
    ? "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold active:scale-95 transition-transform"
    : "flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all";

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`${baseClasses} ${isSaved 
        ? "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200" 
        : "bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300"
      } ${saving ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      )}
      <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
    </button>
  );
}
