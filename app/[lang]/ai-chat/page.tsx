import { getDictionary } from "@/lib/get-dictionary";
import AIChatPageContent from "./AIChatPageContent";

export default async function AIChatPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return <AIChatPageContent dict={dict} />;
}
