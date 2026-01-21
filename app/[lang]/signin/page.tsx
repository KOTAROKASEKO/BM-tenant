'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { LayoutDashboard, ArrowRight, UserCog } from 'lucide-react'; 

// --- Firebase Imports ---
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from '../../../lib/firebase'; // Adjust path if needed

// --- Configuration ---
const AGENT_LOGIN_URL = "https://bm-agent.vercel.app/login"; 

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2970&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2880&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2940&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=2970&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2940&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2800&auto=format&fit=crop",
];

const SCROLL_COLS = [
  [...ROOM_IMAGES, ...ROOM_IMAGES],
  [...ROOM_IMAGES.reverse(), ...ROOM_IMAGES.reverse()],
  [...ROOM_IMAGES, ...ROOM_IMAGES],
];

export default function SignInPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params?.lang as string || 'ja';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get return URL from query params, default to home
  const returnUrl = searchParams.get('returnUrl') || `/${lang}`;

  // --- Helper: Ensure Tenant Profile Exists ---
  const ensureTenantProfile = async (user: any) => {
    try {
        const docRef = doc(db, "users_prof", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Create new Tenant Profile
            await setDoc(docRef, {
                email: user.email,
                displayName: user.displayName || 'New Tenant',
                profileImageUrl: user.photoURL || '',
                bio: "I am looking for a room.",
                role: "tenant", // Important: Mark as tenant
                createdAt: serverTimestamp()
            });
            console.log("✅ Created new tenant profile");
        }
    } catch (err) {
        console.error("Profile creation failed:", err);
    }
  };

  // --- Email Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged in:", userCredential.user.uid);
        
        // Ensure profile exists (in case they signed up but profile creation failed)
        await ensureTenantProfile(userCredential.user);
        
        // Redirect to return URL or home
        router.push(returnUrl); 
    } catch (err: any) {
        console.error("Login Error:", err);
        setError(err.message.replace('Firebase:', '').trim());
    } finally {
        setLoading(false);
    }
  };

  // --- Google Login ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log("Google Login Success:", user.uid);

        // Create Tenant Profile if first time
        await ensureTenantProfile(user);

        // Redirect to return URL or home
        router.push(returnUrl);
    } catch (err: any) {
        console.error("Google Login Error:", err);
        setError(err.message.replace('Firebase:', '').trim());
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">
      
      {/* --- Autoscrolling Background --- */}
      <div className="absolute inset-0 z-0 grid grid-cols-3 gap-4 p-4 opacity-60 bg-black/10">
        <div className="flex flex-col gap-4 animate-scroll-slow">
            {SCROLL_COLS[0].map((src, i) => (
                <img key={`c1-${i}`} src={src} className="w-full h-64 object-cover rounded-xl shadow-lg" alt="Room" />
            ))}
        </div>
        <div className="flex flex-col gap-4 animate-scroll-medium -mt-24">
            {SCROLL_COLS[1].map((src, i) => (
                <img key={`c2-${i}`} src={src} className="w-full h-64 object-cover rounded-xl shadow-lg" alt="Room" />
            ))}
        </div>
        <div className="flex flex-col gap-4 animate-scroll-fast">
            {SCROLL_COLS[2].map((src, i) => (
                <img key={`c3-${i}`} src={src} className="w-full h-64 object-cover rounded-xl shadow-lg" alt="Room" />
            ))}
        </div>
      </div>

      {/* --- Dark Overlay --- */}
      <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[2px]"></div>

      {/* --- Glassmorphism Card --- */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 md:p-10 text-white overflow-hidden relative group">
          
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-2 text-white drop-shadow-md">Welcome Back</h1>
                <p className="text-white/80 text-sm font-medium">Find your perfect room today</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/80 backdrop-blur-sm rounded-lg text-sm text-center font-medium shadow-lg animate-pulse">
                    ⚠️ {error}
                </div>
            )}

            <div className="space-y-5">
                {/* Email/Pass Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition backdrop-blur-sm"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition backdrop-blur-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/20"></div>
                    <span className="flex-shrink-0 mx-4 text-white/50 text-xs font-bold uppercase">Or continue with</span>
                    <div className="flex-grow border-t border-white/20"></div>
                </div>

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3.5 rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-3 backdrop-blur-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                        <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
                        <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
                        <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                </button>
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-white/60">
                    Don't have an account? <Link href={`/${lang}/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-white font-bold hover:underline decoration-2 underline-offset-4">Sign up</Link>
                </p>
            </div>
          </div>
        </div>

        {/* --- Agent Login Button (Outside Card) --- */}
        <div className="mt-8 flex justify-center animate-fade-in-up">
            <a 
                href={AGENT_LOGIN_URL}
                className="group flex items-center gap-3 px-5 py-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-inner">
                    <UserCog size={16} />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-0.5">Are you an Agent?</p>
                    <p className="text-sm font-bold text-white leading-none group-hover:text-indigo-200 transition-colors">Login to Agent Portal &rarr;</p>
                </div>
            </a>
        </div>

      </div>
    </div>
  );
}