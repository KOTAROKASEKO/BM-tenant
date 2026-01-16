"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  User, Briefcase, Calendar, Wallet, 
  LogOut, Edit2, Loader2, X, Camera, Plus, 
  Flag, MapPin, Bookmark, MessageSquare, ArrowRight, AlertCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import React from "react";

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

// --- Type Definition ---
type UserProfile = {
  uid?: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  age: number;
  gender: string;
  nationality: string;
  occupation: string;
  selfIntroduction: string;
  moveinDate?: any;
  budget: number;
  roomType: string;
  propertyType: string;
  pax: number;
  pets: string;
  preferredAreas: string[];
  _geoloc?: Array<{ lat: number; lng: number }>;
};

// --- Geocoding Helper ---
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""; 

const getLatLng = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`);
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
};

export default function ProfilePageContent({ dict }: { dict: Dictionary }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit Form States
  const [saving, setSaving] = useState(false);

  // Auth & Fetch Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/signin";
        return;
      }
      setUser(currentUser);

      try {
        const docRef = doc(db, "users_prof", currentUser.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
            profileImageUrl: currentUser.photoURL || "",
            age: 25,
            gender: "Not specified",
            nationality: "Not specified",
            occupation: "Not specified",
            selfIntroduction: "",
            budget: 0,
            moveinDate: null,
            roomType: "Middle",
            propertyType: "Condominium",
            pax: 1,
            pets: "No",
            preferredAreas: [],
          });
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/signin";
  };

  // --- SAVE HANDLER ---
  const handleSave = async (e: React.FormEvent, editedProfile: UserProfile, file?: File | null) => {
    if (!user) return;
    setSaving(true);
    
    try {
      let finalImageUrl = editedProfile.profileImageUrl;

      if (file) {
        console.warn("Storage not configured - skipping image upload");
      }

      const geolocList: Array<{ lat: number; lng: number }> = [];
      
      // Preferred Areasのジオコーディング
      for (const area of editedProfile.preferredAreas) {
         const loc = await getLatLng(area);
         if (loc) geolocList.push(loc);
      }

      const finalData = {
        ...editedProfile,
        profileImageUrl: finalImageUrl,
        _geoloc: geolocList,
        email: user.email 
      };

      await setDoc(doc(db, "users_prof", user.uid), finalData, { merge: true });
      
      setProfile(finalData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-zinc-600" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-24">
      <Navbar dict={dict} />

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        
        {/* --- Header Card --- */}
        <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-50 bg-zinc-200 shadow-inner">
             {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
             ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-900">
                    {profile?.displayName?.charAt(0).toUpperCase() || <User />}
                </div>
             )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{profile?.displayName || "No Name"}</h1>
          <p className="text-sm text-zinc-600 mb-6 font-medium">{profile?.email}</p>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-zinc-800"
          >
            <Edit2 className="h-3 w-3" /> Edit Profile
          </button>
        </div>

        {/* --- Saved Listings Link --- */}
        <Link href="/profile/saved-listings" className="block">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300">
             <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-50 p-3 text-purple-700">
                    <Bookmark className="h-5 w-5" />
                </div>
                <span className="font-bold text-zinc-800">Saved Listings</span>
             </div>
             <ArrowRight className="h-4 w-4 text-zinc-400" />
          </div>
        </Link>

        {/* --- Info Sections --- */}
            
        {/* Personal Info */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-zinc-600">Personal Info</h3>
            <div className="space-y-4">
                <InfoRow icon={<User />} label="Age / Gender" value={`${profile?.age} y/o, ${profile?.gender}`} />
                <InfoRow icon={<Flag />} label="Nationality" value={profile?.nationality} />
                <InfoRow icon={<Briefcase />} label="Occupation" value={profile?.occupation} />
                
                <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                       <MessageSquare className="h-4 w-4 text-zinc-500" />
                       <span className="text-xs font-medium text-zinc-500">About Me</span>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-800 pl-6 border-l-2 border-zinc-200 font-medium">{profile?.selfIntroduction || "No introduction yet."}</p>
                </div>
            </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-zinc-600">Preferences</h3>
            <div className="space-y-4">
                <InfoRow 
                    icon={<Calendar />} 
                    label="Move-in Date" 
                    value={profile?.moveinDate ? new Date(profile.moveinDate.seconds ? profile.moveinDate.seconds * 1000 : profile.moveinDate).toLocaleDateString() : "Not set"} 
                />
                
                {profile?.preferredAreas && profile.preferredAreas.length > 0 ? (
                   <div className="py-2">
                       <div className="flex items-center gap-4 mb-2">
                           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 shrink-0">
                               <MapPin size={14} />
                           </div>
                           <span className="text-xs font-medium text-zinc-500">Preferred Areas</span>
                       </div>
                       <div className="flex flex-wrap gap-2 pl-12">
                          {profile.preferredAreas.map(area => (
                             <span key={area} className="px-3 py-1 border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 rounded-md font-bold">{area}</span>
                          ))}
                       </div>
                   </div>
                ) : (
                    <InfoRow icon={<MapPin />} label="Preferred Areas" value="Not set" />
                )}

                <InfoRow icon={<Wallet />} label="Budget" value={profile?.budget ? `RM ${profile?.budget} / month` : "Not set"} />
                <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                            <span className="text-xs font-bold text-zinc-500 block mb-1">Room Type</span>
                            <p className="font-bold text-sm text-zinc-900">{profile?.roomType}</p>
                        </div>
                        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                            <span className="text-xs font-bold text-zinc-500 block mb-1">Property Type</span>
                            <p className="font-bold text-sm text-zinc-900">{profile?.propertyType}</p>
                        </div>
                        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                            <span className="text-xs font-bold text-zinc-500 block mb-1">Pax</span>
                            <p className="font-bold text-sm text-zinc-900">{profile?.pax} Person</p>
                        </div>
                        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                            <span className="text-xs font-bold text-zinc-500 block mb-1">Pets</span>
                            <p className="font-bold text-sm text-zinc-900">{profile?.pets === 'Yes' ? 'Allowed' : 'Not Allowed'}</p>
                        </div>
                </div>
            </div>
        </div>

        <button onClick={handleLogout} className="w-full rounded-xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
            <LogOut className="mr-2 inline-block h-4 w-4" /> Sign Out
        </button>
      </main>

      {/* --- EDIT MODAL --- */}
      {isEditing && profile && (
        <EditModal 
            initialProfile={profile} 
            onClose={() => setIsEditing(false)} 
            onSave={handleSave}
            saving={saving}
        />
      )}
    </div>
  );
}

// --- Helpers & Sub-Components ---

function InfoRow({ icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 shrink-0">
                {React.cloneElement(icon, { size: 14 })}
            </div>
            <div>
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                <p className="font-bold text-zinc-900 text-sm">{value || "Not specified"}</p>
            </div>
        </div>
    );
}

// Separate Edit Modal Component for cleaner code
function EditModal({ initialProfile, onClose, onSave, saving }: { 
    initialProfile: UserProfile, 
    onClose: () => void, 
    onSave: (e: React.FormEvent, p: UserProfile, f?: File) => void,
    saving: boolean
}) {
    const [formData, setFormData] = useState<UserProfile>(initialProfile);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(initialProfile.profileImageUrl);
    const [errorMsg, setErrorMsg] = useState("");
    
    // List inputs
    const [areaInput, setAreaInput] = useState("");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const addArea = () => {
        if (areaInput.trim()) {
            setFormData({...formData, preferredAreas: [...formData.preferredAreas, areaInput.trim()]});
            setAreaInput("");
        }
    };

    const removeArea = (index: number) => {
        const newAreas = [...formData.preferredAreas];
        newAreas.splice(index, 1);
        setFormData({...formData, preferredAreas: newAreas});
    };

    // Helper for date formatting string YYYY-MM-DD
    const getInitialDate = () => {
        if(!formData.moveinDate) return "";
        try {
            const d = formData.moveinDate.seconds ? new Date(formData.moveinDate.seconds * 1000) : new Date(formData.moveinDate);
            if (isNaN(d.getTime())) return "";
            return d.toISOString().split('T')[0];
        } catch(e) { return ""; }
    };

    // 変更点: 保存前のバリデーション関数
    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        // 1. 名前チェック
        if (!formData.displayName || !formData.displayName.trim()) {
            setErrorMsg("名前を入力してください (Name is required)");
            return;
        }

        // 2. 住みたい場所チェック
        if (!formData.preferredAreas || formData.preferredAreas.length === 0) {
            setErrorMsg("住みたい場所を少なくとも1つ追加してください (Please add at least one Preferred Area)");
            return;
        }

        // 3. 予算チェック
        if (!formData.budget || formData.budget <= 0) {
            setErrorMsg("予算を入力してください (Valid Budget is required)");
            return;
        }

        // 4. Move-in Date チェック
        if (!formData.moveinDate) {
            setErrorMsg("入居予定日を選択してください (Move-in Date is required)");
            return;
        }

        // 全てOKなら保存実行
        onSave(e, formData, imageFile ? imageFile : undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-white z-10">
              <h2 className="font-bold text-lg text-zinc-900">Edit Profile</h2>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 text-zinc-500"><X className="h-5 w-5" /></button>
            </div>
            
            <form className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Error Alert */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 border border-red-100">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold">{errorMsg}</p>
                </div>
              )}

              {/* Image Picker */}
              <div className="flex justify-center">
                  <div className="relative group cursor-pointer">
                      <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-zinc-200 bg-zinc-50">
                          {previewUrl ? (
                              <img src={previewUrl} className="h-full w-full object-cover" />
                          ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-400"><User /></div>
                          )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="text-white h-6 w-6" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                  </div>
              </div>

              {/* Personal Section */}
              <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-zinc-600 tracking-wider border-b border-zinc-200 pb-2">Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label="Display Name *" value={formData.displayName} onChange={(v) => setFormData({...formData, displayName: v})} />
                    <InputGroup label="Age" type="number" value={formData.age} onChange={(v) => setFormData({...formData, age: parseInt(v)})} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectGroup 
                        label="Gender" 
                        value={formData.gender} 
                        options={["Male", "Female", "Mix", "Not specified"]}
                        onChange={(v) => setFormData({...formData, gender: v})} 
                    />
                    <InputGroup label="Nationality" value={formData.nationality} onChange={(v) => setFormData({...formData, nationality: v})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <InputGroup label="Occupation" value={formData.occupation} onChange={(v) => setFormData({...formData, occupation: v})} />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-700">Bio</label>
                    <textarea 
                        value={formData.selfIntroduction}
                        onChange={(e) => setFormData({...formData, selfIntroduction: e.target.value})}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-black transition-colors"
                    ></textarea>
                  </div>
              </div>

              {/* Preferences Section */}
              <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-zinc-600 tracking-wider border-b border-zinc-200 pb-2">Preferences</h3>
                  
                  {/* Preferred Areas */}
                  <div>
                     <label className="mb-1 block text-xs font-bold text-zinc-700">Preferred Areas * (Geocoded)</label>
                     <div className="flex gap-2 mb-2">
                        <input 
                            value={areaInput} 
                            onChange={(e) => setAreaInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-black" 
                            placeholder="e.g. Bangsar, Mont Kiara..."
                        />
                        <button type="button" onClick={addArea} className="bg-zinc-800 text-white px-3 rounded-lg hover:bg-black"><Plus className="h-4 w-4" /></button>
                     </div>
                     <div className="flex flex-wrap gap-2 min-h-[30px]">
                        {formData.preferredAreas.length === 0 && <span className="text-xs text-red-400 italic">Required</span>}
                        {formData.preferredAreas.map((area, i) => (
                            <span key={i} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-purple-100">
                                {area} <button type="button" onClick={() => removeArea(i)}><X className="h-3 w-3 text-purple-400 hover:text-red-500" /></button>
                            </span>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <InputGroup label="Budget (RM) *" type="number" value={formData.budget} onChange={(v) => setFormData({...formData, budget: parseInt(v)})} />
                     
                     <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-700">Move-in Date *</label>
                        <input 
                            type="date"
                            value={getInitialDate()}
                            onChange={(e) => setFormData({...formData, moveinDate: new Date(e.target.value)})}
                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-black"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup 
                        label="Room Type" 
                        value={formData.roomType} 
                        options={["Single", "Middle", "Master", "Any"]}
                        onChange={(v) => setFormData({...formData, roomType: v})} 
                    />
                     <SelectGroup 
                        label="Property Type" 
                        value={formData.propertyType} 
                        options={["Condominium", "Apartment", "Landed House", "Studio"]}
                        onChange={(v) => setFormData({...formData, propertyType: v})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup 
                        label="Pets" 
                        value={formData.pets} 
                        options={["Yes", "No"]}
                        onChange={(v) => setFormData({...formData, pets: v})} 
                    />
                     <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-700">Pax ({formData.pax})</label>
                        <input 
                            type="range" min="1" max="5" 
                            value={formData.pax} 
                            onChange={(e) => setFormData({...formData, pax: parseInt(e.target.value)})}
                            className="w-full accent-black cursor-pointer"
                        />
                     </div>
                  </div>
              </div>

            </form>

            <div className="border-t border-zinc-200 px-6 py-4 bg-white z-10">
              <button 
                onClick={handleSaveClick} 
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, type="text" }: { label: string, value: any, onChange: (v: string) => void, type?: string }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-zinc-700">{label}</label>
            <input 
                type={type} 
                value={value || ""} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={label} 
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-black transition-colors"
            />
        </div>
    );
}

function SelectGroup({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-zinc-700">{label}</label>
            <div className="relative">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-black transition-colors"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
    );
}
