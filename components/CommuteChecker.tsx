"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, MapPin, Navigation, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
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

  // 2. Logic States
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

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
            setUsername(userData.displayName || currentUser.displayName || "User");
            setHasProfile(true);
          } else {
            setUsername(currentUser.displayName || "User");
            setHasProfile(false);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUsername(currentUser.displayName || "User");
          setHasProfile(null);
        }
      } else {
        setUsername("");
        setHasProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheck = async () => {
    setError("");
    
    // Safety check
    if (!user) {
      setError("Please log in to check commute times.");
      return;
    }

    setAnalyzing(true);

    try {
      // 4. Get Fresh Token (Crucial for API security)
      const token = await user.getIdToken(true); 

      // 5. Call API
      const res = await fetch("/api/revalidate/assess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Send Token
        },
        body: JSON.stringify({
          propertyId,
          propertyLocation
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze commute.");
      }

      setResult(data.data);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
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

      {/* --- Result Display --- */}
      {result ? (
        <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 space-y-4 animate-in fade-in zoom-in-95">
             <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Score</span>
                <span className="text-2xl font-black text-zinc-900">{result.score}/100</span>
             </div>
             
             <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 block mb-2">Commute to {result.commute.destination}</span>
                <p className="font-bold text-zinc-900 flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-blue-600" /> {result.commute.duration} via {result.commute.mode}
                </p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{result.commute.details}</p>
             </div>

             <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wider">AI Analysis</h4>
                <div className="space-y-4">
                    <div>
                        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Commute</h5>
                        <div className="prose prose-sm max-w-none text-zinc-700">
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
                                {result.analysis?.commute || result.comment}
                            </ReactMarkdown>
                        </div>
                    </div>
                    {(result.analysis?.food || result.comment) && (
                        <div>
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Food</h5>
                            <div className="prose prose-sm max-w-none text-zinc-700">
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
                                    {result.analysis?.food || result.comment}
                                </ReactMarkdown>
                            </div>
                        </div>
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
                <Link
                  href={`/${lang}/profile`}
                  className="block mt-3 text-xs text-zinc-500 hover:text-zinc-700 underline underline-offset-2"
                >
                  Enriching your profile will improve the accuracy of the analysis
                </Link>
            </div>
            
        )
      )}
    </div>
  );
}