import { getDictionary } from "@/lib/get-dictionary";
import ProfilePageContent from "./ProfilePageContent";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  
  return <ProfilePageContent dict={dict} lang={lang} />;
}
