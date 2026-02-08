"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { MessageCircle } from "lucide-react";

type ChatButtonProps = {
  agentUserId: string;
  lang: string;
  postId?: string;
  className?: string;
  variant?: "desktop" | "mobile";
};

export default function ChatButton({ 
  agentUserId, 
  lang,
  postId,
  className = "",
  variant = "desktop"
}: ChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleChat = async () => {
    setLoading(true);
    
    try {
      // Check authentication
      if (!currentUser) {
        if (confirm("You need to sign in to chat. Go to login?")) {
          router.push(`/${lang}/signin`);
        }
        setLoading(false);
        return;
      }

      // Prevent chatting with self
      if (currentUser.uid === agentUserId) {
        alert("This is your own property!");
        setLoading(false);
        return;
      }

      if (!agentUserId) {
        alert("Agent info missing.");
        setLoading(false);
        return;
      }

      // Generate thread ID (alphabetical sort ensures uniqueness)
      const uids = [currentUser.uid, agentUserId].sort();
      const threadId = uids.join('_');

      // Check if thread exists, create if not
      const threadRef = doc(db, 'chats', threadId);
      const threadSnap = await getDoc(threadRef);

      if (!threadSnap.exists()) {
        await setDoc(threadRef, {
          participants: uids,
          whoSent: currentUser.uid,
          whoReceived: agentUserId,
          lastMessage: "Started a conversation",
          timeStamp: serverTimestamp(),
          [`unreadCount_${agentUserId}`]: 1,
          [`unreadCount_${currentUser.uid}`]: 0,
        });
        if (postId) {
          fetch("/api/analytics/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId }),
          }).catch(() => {});
        }
      }

      // Navigate to chat page with thread ID
      router.push(`/${lang}/chat?id=${threadId}`);
    } catch (e) {
      console.error("Chat creation error:", e);
      alert("Failed to start chat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className={className}
    >
      <MessageCircle className={variant === "mobile" ? "h-5 w-5" : "h-4 w-4"} />
      {loading ? "Loading..." : "Chat"}
    </button>
  );
}
