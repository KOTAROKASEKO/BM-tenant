"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { 
  Search, Send, MoreVertical, ArrowLeft, 
  Image as ImageIcon, Loader2, WifiOff, MapPin 
} from "lucide-react";
import { 
  collection, query, where, or, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import moment from "moment";
import Link from "next/link"; 

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

type Thread = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
  lastMessage: string;
  timestamp: any;
  unreadCount: number;
};

type Message = {
  id: string;
  text: string;
  whoSentId: string;
  timestamp: any;
  messageType: "text" | "image" | "property_template";
  remoteUrl?: string; 
};

export default function ChatPageContent({ dict }: { dict: Dictionary }) {
  const [user, setUser] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const [showMobileChat, setShowMobileChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Connection Status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
  }, []);

  // 2. Auth & Threads Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/signin";
        return;
      }
      setUser(currentUser);

      const q = query(
        collection(db, "chats"),
        or(where("whoSent", "==", currentUser.uid), where("whoReceived", "==", currentUser.uid)),
        orderBy("timeStamp", "desc")
      );

      const unsubThreads = onSnapshot(q, async (snapshot) => {
        const threadList: Thread[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const otherId = data.whoSent === currentUser.uid ? data.whoReceived : data.whoSent;
          
          let profile = { displayName: "User", profileImageUrl: "" };
          try {
            const userSnap = await getDoc(doc(db, "users_prof", otherId));
            if (userSnap.exists()) profile = userSnap.data() as any;
          } catch (e) { console.error(e); }

          threadList.push({
            id: docSnap.id,
            otherUserId: otherId,
            otherUserName: profile.displayName || "User",
            otherUserPhoto: profile.profileImageUrl || "",
            lastMessage: data.lastMessage || "Started a chat",
            timestamp: data.timeStamp,
            unreadCount: data[`unreadCount_${currentUser.uid}`] || 0,
          });
        }
        setThreads(threadList);
        setLoading(false);
      });

      return () => unsubThreads();
    });

    return () => unsubAuth();
  }, []);

  // 3. Messages Listener
  useEffect(() => {
    if (!activeThreadId) return;
    const q = query(collection(db, "chats", activeThreadId, "messages"), orderBy("timestamp", "asc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Mark as read
      if(user) {
         updateDoc(doc(db, "chats", activeThreadId), { [`unreadCount_${user.uid}`]: 0 }).catch(()=>{});
      }

      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [activeThreadId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !user) return;
    const text = inputText.trim();
    setInputText("");

    try {
      const currentThread = threads.find(t => t.id === activeThreadId);
      await addDoc(collection(db, "chats", activeThreadId, "messages"), {
        text, whoSentId: user.uid, timestamp: serverTimestamp(), messageType: "text",
      });
      await updateDoc(doc(db, "chats", activeThreadId), {
        lastMessage: text, timeStamp: serverTimestamp(),
        [`unreadCount_${currentThread?.otherUserId}`]: (currentThread?.unreadCount || 0) + 1,
      });
    } catch (error) { console.error(error); }
  };

  const activeThreadData = threads.find(t => t.id === activeThreadId);

  // ★ HELPER: Render Different Message Types
  const renderMessageContent = (msg: Message) => {
    if (msg.messageType === "text") {
      return <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>;
    }

    if (msg.messageType === "image") {
       return (
         <img 
           src={msg.remoteUrl || "https://placehold.co/200x200?text=No+Image"} 
           alt="Attachment"
           className="rounded-lg max-w-[200px] bg-zinc-100 object-cover"
         />
       );
    }

    if (msg.messageType === "property_template") {
      try {
        const data = JSON.parse(msg.text);
        const cover = (data.photoUrls && data.photoUrls.length > 0) ? data.photoUrls[0] : "https://placehold.co/300x200?text=No+Image";
        
        return (
            <div className="w-64 overflow-hidden rounded-xl bg-white shadow-sm border border-zinc-200">
                <div className="relative h-32 bg-zinc-200">
                    <img src={cover} alt={data.name} className="h-full w-full object-cover" />
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        RM {data.rent}
                    </div>
                </div>
                <div className="p-3 text-left">
                    <h4 className="mb-1 truncate text-sm font-bold text-zinc-900">{data.name || "Property"}</h4>
                    <p className="mb-3 truncate text-xs text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {data.location || "Unknown"}
                    </p>
                    <Link 
                        href={`/property/${data.postId}`} 
                        className="block w-full rounded-lg bg-black py-2 text-center text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        );
      } catch (e) {
        return <p className="text-xs italic text-red-500">Error loading property card</p>;
      }
    }
    return <p className="text-red-500">Unknown message type</p>;
  };

  // ★ HELPER: Shimmer Skeleton for Threads
  const ThreadListSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-zinc-50 p-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-zinc-200" />
              <div className="h-3 w-10 rounded bg-zinc-200" />
            </div>
            <div className="h-3 w-3/4 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-zinc-50 font-sans">
      <Navbar dict={dict} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden border-zinc-200 bg-white shadow-sm md:my-6 md:rounded-2xl md:border">
        
        {/* Thread List */}
        <aside className={`${showMobileChat ? "hidden" : "flex"} w-full flex-col border-r border-zinc-100 md:flex md:w-80 lg:w-96`}>
           <div className="border-b border-zinc-100 p-4 space-y-3">
            {!isOnline && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                <WifiOff className="h-3 w-3" /> <span>Offline Mode</span>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search chats..." className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {loading ? (
                // Show Shimmer when loading
                <ThreadListSkeleton />
             ) : (
                // Show List when loaded
                threads.map((thread) => (
                    <div 
                      key={thread.id}
                      onClick={() => { setActiveThreadId(thread.id); setShowMobileChat(true); }}
                      className={`cursor-pointer border-b border-zinc-50 p-4 transition-colors hover:bg-zinc-50 ${activeThreadId === thread.id ? "bg-zinc-100" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={thread.otherUserPhoto || `https://ui-avatars.com/api/?name=${thread.otherUserName}`} className="h-12 w-12 rounded-full border border-zinc-200 object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-baseline justify-between">
                            <span className={`truncate text-sm font-bold ${thread.unreadCount > 0 ? "text-black" : "text-zinc-700"}`}>{thread.otherUserName}</span>
                            <span className="text-[10px] text-zinc-400">{thread.timestamp ? moment(thread.timestamp?.toDate()).fromNow(true) : ""}</span>
                          </div>
                          <p className={`truncate text-xs ${thread.unreadCount > 0 ? "font-bold text-black" : "text-zinc-500"}`}>{thread.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                ))
             )}
          </div>
        </aside>

        {/* Chat View */}
        <section className={`${!showMobileChat ? "hidden" : "flex"} flex-1 flex-col bg-white md:flex`}>
          {activeThreadId ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowMobileChat(false)} className="md:hidden text-zinc-500 hover:text-black"><ArrowLeft className="h-5 w-5" /></button>
                  <img src={activeThreadData?.otherUserPhoto || `https://ui-avatars.com/api/?name=${activeThreadData?.otherUserName}`} className="h-10 w-10 rounded-full border border-zinc-200 object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{activeThreadData?.otherUserName}</h3>
                    <span className={`flex items-center gap-1 text-xs font-medium ${isOnline ? "text-emerald-600" : "text-amber-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span> 
                      {isOnline ? "Online" : "Offline Mode"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
                {messages.map((msg) => {
                  const isMe = msg.whoSentId === user?.uid;
                  const isTemplate = msg.messageType === "property_template";
                  
                  const bubbleClass = isTemplate 
                    ? "max-w-[85%] bg-transparent p-0 shadow-none border-none"
                    : `max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe ? "bg-black text-white rounded-tr-sm" : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm"}`;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={bubbleClass}>
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="border-t border-zinc-100 p-4 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1 rounded-2xl bg-zinc-100 px-4 py-2 focus-within:ring-1 focus-within:ring-black">
                    <input 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isOnline ? "Type a message..." : "Waiting for connection..."} 
                      disabled={!isOnline}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                  <button type="submit" disabled={!inputText.trim() || !isOnline} className="rounded-full bg-black p-3 text-white transition-transform active:scale-95 disabled:bg-zinc-300">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="hidden h-full flex-col items-center justify-center text-zinc-400 md:flex">
              <p>Select a conversation</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
