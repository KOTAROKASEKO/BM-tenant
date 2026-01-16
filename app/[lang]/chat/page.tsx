import { getDictionary } from "@/lib/get-dictionary";
import ChatPageContent from "./ChatPageContent";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return <ChatPageContent dict={dict} />;
}
