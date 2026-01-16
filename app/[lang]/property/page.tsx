import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import PropertySearchContent from "./PropertySearchContent";

// --- 4. Main Component (Server Component) ---
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>}>
      <PropertySearchContent dict={dict} />
    </Suspense>
  );
}
