import { Suspense } from "react";
import { getDictionary } from "@/lib/get-dictionary";
import ChatPageContent from "./ChatPageContent";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading chat...</p></div>}>
      <ChatPageContent dict={dict} />
    </Suspense>
  );
}
