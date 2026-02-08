"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, MapPin, Navigation, AlertCircle, CheckCircle2, Sparkles, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CommuteChecker({ 
  propertyId, 
  propertyLocation 
}: { 
  propertyId: string, 
  propertyLocation: string 
}) {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  // 1. Auth States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Check if auth is still loading
  const [username, setUsername] = useState<string>("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<string>("");
  const [lastSavedPrefs, setLastSavedPrefs] = useState<string>("");

  // 2. Logic States
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // 3. Listen to Auth Changes (Fix for "Not Logged In" error)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false); // Only set to false once we know the status
      
      // Fetch username from user profile
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users_prof", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const prefs = userData.selfIntroduction || "";
            setUsername(userData.displayName || currentUser.displayName || "User");
            setPreferences(prefs);
            setLastSavedPrefs(prefs);
            setHasProfile(true);
          } else {
            setUsername(currentUser.displayName || "User");
            setPreferences("");
            setLastSavedPrefs("");
            setHasProfile(false);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUsername(currentUser.displayName || "User");
          setPreferences("");
          setLastSavedPrefs("");
          setHasProfile(null);
        }
      } else {
        setUsername("");
        setPreferences("");
        setLastSavedPrefs("");
        setHasProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheck = async () => {
    setError("");
    setStreamedText("");
    setResult(null);
    
    if (!user) {
      setError("Please log in to check commute times.");
      return;
    }

    setAnalyzing(true);
    setIsStreaming(true);

    try {
      const token = await user.getIdToken(true); 

      const res = await fetch("/api/revalidate/assess/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId,
          propertyLocation,
          lang
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze commute.");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setStreamedText(accumulated);
        }
      }

      setResult({ streamedMarkdown: accumulated });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
      setIsStreaming(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    setError("");
    try {
      await setDoc(doc(db, "users_prof", user.uid), { selfIntroduction: preferences }, { merge: true });
      setLastSavedPrefs(preferences);
      setHasProfile(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <Navigation className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-lg text-zinc-900">AI Commute Analysis</h3>
      </div>

      <p className="text-sm text-zinc-500 mb-6">
        Check commute time from this property to your registered workplace/school using AI.
      </p>

      {/* --- Error Message --- */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
        </div>
      )}

      {/* --- Result Display (streaming Markdown, ChatGPT-style) --- */}
      {(streamedText || result?.streamedMarkdown) ? (
        <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 space-y-4 animate-in fade-in zoom-in-95">
          <div className="bg-white p-4 rounded-lg border border-zinc-200 min-h-[120px]">
            <div className="prose prose-sm max-w-none text-zinc-700 pl-0">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-sm" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-zinc-900" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-zinc-600" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1.5 ml-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1.5 ml-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-sm leading-relaxed" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold text-zinc-900 mb-2 mt-4 first:mt-0" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold text-zinc-900 mb-2 mt-3 first:mt-0" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-zinc-900 mb-1 mt-2 first:mt-0" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-300 pl-3 py-1 my-2 italic text-zinc-600 bg-blue-50 rounded-r" {...props} />,
                  code: ({node, ...props}) => <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-4 border-zinc-200" {...props} />,
                }}
              >
                {streamedText || result?.streamedMarkdown || ""}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-zinc-900 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- Action Button --- */
        authLoading ? (
            <button disabled className="w-full py-3 rounded-xl bg-zinc-100 text-zinc-400 font-bold flex justify-center items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Check Login...
            </button>
        ) : !user ? (
            <Link href="/signin" className="block w-full text-center py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors">
                Log in to Check Commute
            </Link>
        ) : (
            <div className="space-y-3">
                {hasProfile === false && (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 font-semibold">
                        You can add more about yourself from your profile to enhance this analysis.{" "}
                        <Link href={`/${lang}/profile`} className="underline underline-offset-2 font-bold">
                          Go to Profile
                        </Link>
                    </div>
                )}
                <button 
                    onClick={handleCheck}
                    disabled={analyzing}
                    className="w-full py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {analyzing ? "Analyzing..." : `See life simulator of ${username}`}
                </button>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5">Property preferences</label>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="e.g. Prefer quiet area, near LRT, halal food..."
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPrefs || preferences === lastSavedPrefs}
                    className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingPrefs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save preferences
                  </button>
                </div>
            </div>
            
        )
      )}
    </div>
  );
}