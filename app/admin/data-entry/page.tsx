"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Loader2, CheckCircle, AlertCircle, UploadCloud } from "lucide-react";

// Default Data: V Residence @ Sunway Velocity (Cheras)
const DEFAULT_JSON = JSON.stringify({
  id: "v-residence-sunway-velocity",
  name: "V Residence @ Sunway Velocity",
  location: "Cheras, Kuala Lumpur",
  rating: {
    overall: 4.2,
    management: 3.5,
    security: 4.5,
    cleanliness: 3.0,
    facilities: 4.8
  },
  tags: [
    { label: "Direct Access to Mall", type: "positive", count: 42 },
    { label: "Linked to MRT Maluri", type: "positive", count: 35 },
    { label: "Rain-proof Access", type: "positive", count: 20 },
    { label: "Ants/Pests Issues", type: "negative", count: 12 },
    { label: "Poor Cleaning", type: "negative", count: 8 },
    { label: "Long Elevator Wait", type: "negative", count: 5 }
  ],
  features: {
    isManagedWell: false,
    hasJapaneseStaff: false,
    trafficAvoidable: true,
    isPetFriendly: false
  },
  externalLinks: [
    { source: "Google Maps", url: "https://goo.gl/maps/example", summary: "★4.3 Great location but some noise issues mentioned" },
    { source: "Twitter", url: "https://twitter.com/search?q=SunwayVelocity", summary: "Mentions of rising rental prices" }
  ],
  imageUrl: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80"
}, null, 2);

export default function DataEntryPage() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const data = JSON.parse(jsonInput);
      if (!data.id) throw new Error("JSON must have an 'id' field.");

      // Upload to 'condominiums' collection
      await setDoc(doc(db, "condominiums", data.id), data);

      setStatus("success");
      setMessage(`✅ Successfully uploaded: ${data.name}`);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <UploadCloud className="h-6 w-6" />
          Condo Data Uploader
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-bold text-zinc-700 mb-2">
            JSON Data
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs bg-zinc-900 text-green-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${
            status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {status === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={status === "loading"}
          className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {status === "loading" ? <Loader2 className="animate-spin h-5 w-5" /> : "Upload to Firestore"}
        </button>
      </div>
    </div>
  );
}