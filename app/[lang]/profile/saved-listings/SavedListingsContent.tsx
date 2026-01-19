"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Bookmark, 
  Loader2, 
  MapPin, 
  ArrowLeft,
  Heart
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
} from "firebase/firestore";
import SaveButton from "@/components/SaveButton";

type Dictionary = {
  nav: {
    reviews: string;
    chat: string;
    profile: string;
    signin: string;
    new_badge: string;
    discover?: string;
  };
};

type Property = {
  id: string;
  condominiumName: string;
  location: string;
  rent: number;
  roomType: string;
  gender: string;
  imageUrls: string[];
};

export default function SavedListingsContent({ dict, lang }: { dict: Dictionary; lang: string }) {
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push(`/${lang}/signin`);
        return;
      }
      setUser(currentUser);
      await fetchSavedProperties(currentUser.uid);
    });

    return () => unsubscribe();
  }, [lang, router]);

  const fetchSavedProperties = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get all saved post IDs
      const savedPostsRef = collection(db, "users", userId, "savedPosts");
      const savedPostsSnapshot = await getDocs(savedPostsRef);
      
      if (savedPostsSnapshot.empty) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const savedPostIds = savedPostsSnapshot.docs.map(doc => doc.id);

      // Fetch actual post data from posts collection
      const postsPromises = savedPostIds.map(async (postId) => {
        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
          const data = postDoc.data();
          return {
            id: postDoc.id,
            condominiumName: data.condominiumName || "Untitled Property",
            location: data.location || "Unknown Location",
            rent: Number(data.rent) || 0,
            roomType: data.roomType || "Room",
            gender: data.gender || "Mix",
            imageUrls: data.imageUrls || [],
          };
        }
        return null;
      });

      const posts = (await Promise.all(postsPromises)).filter(
        (post): post is Property => post !== null
      );

      // Filter out posts with status !== 'open' (if status field exists)
      const openPosts = posts.filter((post) => {
        // We'll check status when fetching, but for now just return all
        return true;
      });

      setProperties(openPosts);
    } catch (error) {
      console.error("Error fetching saved properties:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans">
        <Navbar dict={dict} />
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar dict={dict} />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/${lang}/profile`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3 text-purple-700">
              <Bookmark className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900">Saved Listings</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {properties.length} {properties.length === 1 ? "property" : "properties"} saved
              </p>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-zinc-100 p-6">
              <Bookmark className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No saved listings yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md">
              Start exploring properties and save your favorites to view them later.
            </p>
            <Link
              href={`/${lang}`}
              className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const image = property.imageUrls && property.imageUrls.length > 0
                ? property.imageUrls[0]
                : "https://placehold.co/600x400?text=No+Image";

              return (
                <div
                  key={property.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-lg"
                >
                  {/* Image */}
                  <Link href={`/${lang}/property/${property.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                      <img
                        src={image}
                        alt={property.condominiumName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        {property.roomType}
                      </div>
                      <div className="absolute right-3 top-3">
                        <div className="rounded-full bg-white/90 p-2 backdrop-blur-sm">
                          <Bookmark className="h-4 w-4 fill-purple-600 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <Link href={`/${lang}/property/${property.id}`}>
                        <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 group-hover:underline">
                          {property.condominiumName}
                        </h3>
                      </Link>
                      <span className="shrink-0 text-sm font-black text-black">
                        RM {property.rent}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{property.location}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
                      <span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                        {property.gender} Unit
                      </span>
                      <SaveButton 
                        postId={property.id} 
                        className="p-2 min-w-0"
                        variant="desktop"
                        onSaveChange={(isSaved) => {
                          if (!isSaved) {
                            // Remove from list when unsaved
                            setProperties(prev => prev.filter(p => p.id !== property.id));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
