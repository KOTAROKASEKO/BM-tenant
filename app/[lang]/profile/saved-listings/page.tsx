import { getDictionary } from "@/lib/get-dictionary";
import SavedListingsContent from "./SavedListingsContent";

export default async function SavedListingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return <SavedListingsContent dict={dict} lang={lang} />;
}
