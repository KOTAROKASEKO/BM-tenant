"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  User, Briefcase, MapPin, Calendar, Wallet, 
  LogOut, Edit2, Loader2, X 
} from "lucide-react";
import { auth, db } from "../../lib/firebase"; // Ensure path
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Type Definition
type UserProfile = {
  displayName: string;
  email: string;
  profileImageUrl: string;
  age: number;
  gender: string;
  nationality: string;
  occupation: string;
  location: string; // Work Location
  selfIntroduction: string;
  moveinDate?: any;
  budget: number;
  roomType: string;
  pax: number;
  pets: string;
  hobbies: string[];
  preferredAreas: string[];
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth & Fetch Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/signin";
        return;
      }
      setUser(currentUser);

      try {
        const docRef = doc(db, "users", currentUser.uid); // Or "users_prof" depending on your schema
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          // Default Profile
          setProfile({
            displayName: currentUser.displayName || "New User",
            email: currentUser.email || "",
            profileImageUrl: currentUser.photoURL || "",
            age: 20,
            gender: "Not Specified",
            nationality: "",
            occupation: "",
            location: "",
            selfIntroduction: "",
            budget: 1000,
            roomType: "Single",
            pax: 1,
            pets: "No",
            hobbies: [],
            preferredAreas: []
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/signin";
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-12">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        
        {/* --- Header Card --- */}
        <div className="mb-8 flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-50 bg-zinc-200">
             {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
             ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
                    {profile?.displayName?.charAt(0)}
                </div>
             )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{profile?.displayName}</h1>
          <p className="text-sm text-zinc-500 mb-6">{profile?.email}</p>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-zinc-800"
          >
            <Edit2 className="h-3 w-3" /> Edit Profile
          </button>
        </div>

        {/* --- Info Sections --- */}
        <div className="space-y-6">
            
            {/* Personal Info */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-zinc-400">Personal Info</h3>
                <div className="space-y-4">
                    <InfoRow icon={<User />} label="Age / Gender" value={`${profile?.age} y/o, ${profile?.gender}`} />
                    <InfoRow icon={<Briefcase />} label="Occupation" value={profile?.occupation} />
                    <InfoRow icon={<MapPin />} label="Work Location" value={profile?.location} />
                    <div className="pt-2">
                        <span className="mb-1 block text-xs text-zinc-400">About Me</span>
                        <p className="text-sm leading-relaxed text-zinc-700">{profile?.selfIntroduction || "No introduction yet."}</p>
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-zinc-400">Preferences</h3>
                <div className="space-y-4">
                    <InfoRow icon={<Wallet />} label="Budget" value={`RM ${profile?.budget} / month`} />
                    <InfoRow icon={<Calendar />} label="Move-in Date" value={profile?.moveinDate ? new Date(profile?.moveinDate.toDate?.() || profile.moveinDate).toLocaleDateString() : "Not set"} />
                    <div className="grid grid-cols-2 gap-4">
                         <div className="rounded-lg bg-zinc-50 p-3">
                            <span className="text-xs text-zinc-400">Room Type</span>
                            <p className="font-semibold text-sm">{profile?.roomType}</p>
                         </div>
                         <div className="rounded-lg bg-zinc-50 p-3">
                            <span className="text-xs text-zinc-400">Pax</span>
                            <p className="font-semibold text-sm">{profile?.pax} Person</p>
                         </div>
                    </div>
                </div>
            </div>

            <button onClick={handleLogout} className="w-full rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
                <LogOut className="mr-2 inline-block h-4 w-4" /> Sign Out
            </button>
        </div>
      </main>

      {/* --- EDIT MODAL --- */}
      {isEditing && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex h-full max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h2 className="font-bold text-lg">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="rounded-full p-1 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Display Name" value={profile.displayName} onChange={(v: string) => setProfile({...profile, displayName: v})} />
                 <InputGroup label="Age" type="number" value={profile.age} onChange={(v: string) => setProfile({...profile, age: parseInt(v)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-500">Gender</label>
                    <select 
                        value={profile.gender}
                        onChange={(e) => setProfile({...profile, gender: e.target.value})}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
                    >
                        <option>Male</option><option>Female</option><option>Mix</option>
                    </select>
                 </div>
                 <InputGroup label="Occupation" value={profile.occupation} onChange={(v: string) => setProfile({...profile, occupation: v})} />
              </div>
              <InputGroup label="Work Location (for Commute)" value={profile.location} onChange={(v: string) => setProfile({...profile, location: v})} />
              
              <div>
                 <label className="mb-1 block text-xs font-bold text-zinc-500">Bio</label>
                 <textarea 
                    value={profile.selfIntroduction}
                    onChange={(e) => setProfile({...profile, selfIntroduction: e.target.value})}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
                 ></textarea>
              </div>

              <div className="h-px bg-zinc-100 my-4"></div>
              
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Budget (RM)" type="number" value={profile.budget} onChange={(v: string) => setProfile({...profile, budget: parseInt(v)})} />
                 <InputGroup label="Move-in Date" type="date" value={"" /* Date handling omitted for brevity, stick to string or moment */} onChange={(v: string) => console.log(v)} />
              </div>
            </form>

            <div className="border-t border-zinc-100 px-6 py-4">
              <button onClick={handleSave} className="w-full rounded-xl bg-black py-3 font-bold text-white hover:bg-zinc-800">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoRow({ icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                {React.cloneElement(icon, { size: 14 })}
            </div>
            <div>
                <p className="text-xs text-zinc-400">{label}</p>
                <p className="font-semibold text-zinc-900 text-sm">{value || "-"}</p>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, type="text" }: any) {
    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-zinc-500">{label}</label>
            <input 
                type={type} 
                value={value || ""} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
            />
        </div>
    );
}

import React from "react";