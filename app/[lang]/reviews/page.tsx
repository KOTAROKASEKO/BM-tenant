import { getDictionary } from "@/lib/get-dictionary";
import { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import ReviewsPageContent from "./ReviewsPageContent";

const baseUrl = 'https://bilikmatch.com';

export type CondoListItem = {
  id: string;
  name: string;
  location: string;
  rating: { overall: number; management: number };
  tags: { label: string; type: "positive" | "negative"; count?: number }[];
  imageUrl: string;
};

async function getCondominiumsList(): Promise<CondoListItem[]> {
  try {
    const snapshot = await adminDb.collection("condominiums").get();
    const list: CondoListItem[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as any;
      const features = data.features || {};
      const name = features.name ?? data.name ?? "Unknown Property";
      const location = features.location ?? data.location ?? "Malaysia";
      const imageUrl = features.imageUrl ?? data.imageUrl ?? "https://placehold.co/600x400?text=No+Image";
      list.push({
        id: doc.id,
        name,
        location,
        rating: {
          overall: data.rating?.overall ?? 0,
          management: data.rating?.management ?? 0,
        },
        tags: data.tags || [],
        imageUrl: imageUrl || "https://placehold.co/600x400?text=No+Image",
      });
    });
    return list;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  const canonicalUrl = `${baseUrl}/${lang}/reviews`;

  return {
    title: dict.reviews.page_title,
    description: dict.reviews.page_description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': `${baseUrl}/en/reviews`,
        'en': `${baseUrl}/en/reviews`,
        'ja': `${baseUrl}/ja/reviews`,
      },
    },
  };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "ja");
  const condos = await getCondominiumsList();

  return <ReviewsPageContent lang={lang} dict={dict} initialCondos={condos} />;
}

