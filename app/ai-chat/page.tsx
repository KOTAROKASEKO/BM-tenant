"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar"; // Ensure you have this or remove if using layout
import { 
  Send, Plus, MessageSquare, Trash2, 
  Menu, X, MapPin, Loader2, Sparkles, AlertTriangle 
} from "lucide-react";
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, setDoc, deleteDoc, 
  getDoc, updateDoc, increment, Timestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Adjust path to your firebase config
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Types ---

type AIChatRoom = {
  id: string;
  title: string;
  lastMessageText: string;
  lastMessageTimestamp: any;
  createdAt: any;
};

type AIChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: any;
  suggestedPosts: Property[]; // Array of properties suggested by AI
};

type Property = {
  objectID: string;
  condominiumName: string;
  rent: number;
  location: string;
  imageUrls?: string[];
  roomType?: string;
  gender?: string;
};

// --- Constants ---
const MAX_DAILY_MESSAGES = 5;

export default function AIChatPage() {
  // Auth State
  const [user, setUser] = useState<any>(null);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [loading, setLoading] = useState(true);
  
  // Chat Data State
  const [chatRooms, setChatRooms] = useState<AIChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  
  // Input State
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/signin";
        return;
      }
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // 2. Listen to Chat Rooms (Sidebar History)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "ai_chat_rooms"),
      where("userId", "==", user.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AIChatRoom[];
      setChatRooms(rooms);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 3. Listen to Messages (Active Chat)
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Flutter uses root collection 'ai_chat_messages' with chatRoomId field
    const q = query(
      collection(db, "ai_chat_messages"),
      where("chatRoomId", "==", activeChatId),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Parse recommended properties similar to Flutter ViewModel
        let suggestions: Property[] = [];
        if (data.recommendedProperties && Array.isArray(data.recommendedProperties)) {
          suggestions = data.recommendedProperties.map((p: any) => ({
            objectID: p.objectID || p.id,
            condominiumName: p.condominiumName || p.name || "Unknown Property",
            rent: p.rent || 0,
            location: p.location || "",
            imageUrls: p.imageUrls || p.photoUrls || [],
            roomType: p.roomType,
            gender: p.gender
          }));
        }

        return {
          id: doc.id,
          text: data.text || "",
          isUser: data.isUser || false,
          timestamp: data.timestamp,
          suggestedPosts: suggestions,
        };
      }) as AIChatMessage[];

      setMessages(msgs);
      // Scroll to bottom
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [activeChatId]);

  // --- Logic Functions ---

  // Check Daily Limit (Ref: Flutter _checkAndIncrementDailyLimit)
  const checkDailyLimit = async (): Promise<boolean> => {
    if (!user) return false;
    // Developer bypass can be added here
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const statsRef = doc(db, "user_usage_stats", user.uid);
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      await setDoc(statsRef, {
        dailyMessageCount: 1,
        lastMessageDate: serverTimestamp(),
      });
      return true;
    }

    const data = statsSnap.data();
    const lastDate = data.lastMessageDate?.toDate();
    
    // Reset if it's a new day
    if (!lastDate || lastDate < today) {
      await updateDoc(statsRef, {
        dailyMessageCount: 1,
        lastMessageDate: serverTimestamp(),
      });
      return true;
    }

    // Check limit
    if (data.dailyMessageCount < MAX_DAILY_MESSAGES) {
      await updateDoc(statsRef, {
        dailyMessageCount: increment(1),
        lastMessageDate: serverTimestamp(),
      });
      return true;
    }

    return false;
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const text = overrideText || inputText;
    if (!text.trim() || !user) return;
    if (!activeChatId && !overrideText && !inputText) return; // Safety

    setInputText(""); // Clear input immediately
    setSending(true);

    // 1. Check Limit
    const allowed = await checkDailyLimit();
    if (!allowed) {
      setMessages(prev => [...prev, {
        id: "system-limit",
        text: `⚠️ Daily limit reached. Free users can send up to ${MAX_DAILY_MESSAGES} messages per day.`,
        isUser: false,
        timestamp: new Date(),
        suggestedPosts: []
      }]);
      setSending(false);
      return;
    }

    try {
      let currentChatId = activeChatId;

      // 2. Create Room if New
      if (!currentChatId) {
        const newRoomRef = doc(collection(db, "ai_chat_rooms"));
        currentChatId = newRoomRef.id;
        
        await setDoc(newRoomRef, {
          userId: user.uid,
          title: `New Chat - ${new Date().toLocaleDateString()}`,
          createdAt: serverTimestamp(),
          lastMessageText: text,
          lastMessageTimestamp: serverTimestamp(),
          latestConditions: {}, // Flutter uses this for filter extraction
        });
        
        setActiveChatId(currentChatId);
      }

      // 3. Add User Message (isProcessed = false triggers AI Cloud Function)
      await addDoc(collection(db, "ai_chat_messages"), {
        chatRoomId: currentChatId,
        text: text,
        isUser: true,
        timestamp: serverTimestamp(),
        isProcessed: false, // Critical for AI backend trigger
        recommendedProperties: []
      });

      // 4. Update Room Metadata
      await updateDoc(doc(db, "ai_chat_rooms", currentChatId), {
        lastMessageText: text,
        lastMessageTimestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setIsSidebarOpen(false);
  };

  const deleteChat = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat history?")) return;

    try {
      // Note: A backend trigger is usually better for deleting sub-messages, 
      // but here we just delete the room doc as per client-side request.
      // Ideally, loop and delete messages too, but we'll stick to room for now.
      await deleteDoc(doc(db, "ai_chat_rooms", roomId));
      if (activeChatId === roomId) setActiveChatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Renders ---

  const SuggestionChip = ({ text }: { text: string }) => (
    <button
      onClick={() => handleSendMessage(undefined, text)}
      disabled={sending}
      className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50"
    >
      {text}
    </button>
  );

  return (
    <div className="flex h-screen flex-col bg-zinc-50 font-sans">
      <Navbar />

      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden border-t border-zinc-200 bg-white shadow-sm lg:my-6 lg:rounded-2xl lg:border">
        
        {/* --- SIDEBAR --- */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-50 w-72 transform bg-zinc-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-2 font-bold text-white">
                 <Sparkles className="h-5 w-5 text-purple-400" />
                 AI Assistant
               </div>
               <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
                 <X className="h-6 w-6" />
               </button>
            </div>

            <div className="px-4 pb-4">
              <button 
                onClick={startNewChat}
                className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" /> New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <div className="mb-2 px-2 text-xs font-bold uppercase text-zinc-500">History</div>
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
              ) : chatRooms.length === 0 ? (
                <p className="px-4 text-sm text-zinc-500">No chat history.</p>
              ) : (
                chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                        setActiveChatId(room.id);
                        setIsSidebarOpen(false);
                    }}
                    className={`group relative mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                      activeChatId === room.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{room.title}</span>
                    {activeChatId === room.id && (
                        <button 
                            onClick={(e) => deleteChat(room.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Usage Info (Optional) */}
            <div className="border-t border-zinc-800 p-4">
               <div className="flex items-center gap-2 rounded-lg bg-zinc-800 p-3">
                  <div className="rounded-full bg-purple-500/20 p-2 text-purple-400">
                     <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-white">Free Plan</p>
                     <p className="text-[10px] text-zinc-400">Limited daily messages</p>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* --- MAIN CHAT AREA --- */}
        <section className="flex flex-1 flex-col bg-white">
          
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 p-4 lg:hidden">
             <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-600">
                <Menu className="h-6 w-6" />
             </button>
             <span className="font-bold text-zinc-900">AI Assistant</span>
             <div className="w-6" /> {/* Spacer */}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            {!activeChatId ? (
              // Welcome State
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 rounded-full bg-zinc-100 p-6">
                  <Sparkles className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-zinc-900">What's on the agenda today?</h2>
                <p className="mb-8 max-w-md text-sm text-zinc-500">
                  I can help you find the perfect rental property. Try asking about specific locations, budgets, or amenities.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <SuggestionChip text="Find a master room in KLCC under RM 1500" />
                  <SuggestionChip text="Rooms near Sunway University" />
                  <SuggestionChip text="Pet-friendly unit with balcony" />
                </div>
              </div>
            ) : (
              // Active Chat
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                    <div 
                        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                            msg.isUser 
                             ? "bg-zinc-900 text-white rounded-tr-sm" 
                             : "bg-zinc-50 text-zinc-800 rounded-tl-sm border border-zinc-100"
                        }`}
                    >
                        {/* Text Content */}
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                        >
                            {msg.text}
                        </ReactMarkdown>

                        {/* Suggested Properties (Horizontal Scroll) */}
                        {msg.suggestedPosts && msg.suggestedPosts.length > 0 && (
                            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                                {msg.suggestedPosts.map((post) => (
                                    <Link 
                                        href={`/property/${post.objectID}`} 
                                        key={post.objectID}
                                        className="snap-center min-w-[220px] max-w-[220px] rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="h-32 bg-zinc-200 relative">
                                            <img 
                                                src={post.imageUrls?.[0] || "https://placehold.co/400x300"} 
                                                alt={post.condominiumName} 
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                                                RM {post.rent}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-xs font-bold text-zinc-900 truncate mb-1">{post.condominiumName}</h4>
                                            <p className="text-[10px] text-zinc-500 flex items-center gap-1 truncate mb-2">
                                                <MapPin className="h-3 w-3" /> {post.location}
                                            </p>
                                            <div className="flex gap-1">
                                                {post.roomType && <span className="bg-zinc-100 text-zinc-600 text-[9px] font-bold px-1.5 py-0.5 rounded">{post.roomType}</span>}
                                                {post.gender && <span className="bg-zinc-100 text-zinc-600 text-[9px] font-bold px-1.5 py-0.5 rounded">{post.gender}</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
                ))}
                
                {/* AI typing indicator (Optimistic or status based) */}
                {messages.length > 0 && messages[messages.length - 1].isUser && (
                   <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 text-zinc-400">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         <span className="text-xs font-medium">AI is thinking...</span>
                      </div>
                   </div>
                )}
                
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-100 bg-white p-4 lg:p-6">
            <div className="mx-auto max-w-3xl relative">
              <form 
                onSubmit={(e) => handleSendMessage(e)}
                className="relative flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-transparent transition-all"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about properties, locations, or budget..."
                  className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-zinc-400"
                  disabled={sending}
                />
                <button 
                    type="submit" 
                    disabled={!inputText.trim() || sending}
                    className="absolute right-2 rounded-lg bg-zinc-900 p-2 text-white transition-all hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                AI can make mistakes. Please verify property details.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}