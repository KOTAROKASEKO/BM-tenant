// app/sitemap.ts (テナント側プロジェクト)
export const dynamic = 'force-dynamic';
import { MetadataRoute } from 'next';

import { adminDb } from '../lib/firebase-admin'; 

const BASE_URL = 'https://bm-tenant.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 静的ページ
  const staticRoutes = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  // 2. Firestoreから物件取得
  const postsSnapshot = await adminDb.collection('posts')
    .where('status', '==', 'open')
    .orderBy('timestamp', 'desc')
    .get();

  // 3. 物件詳細ページのURL生成
  const dynamicRoutes = postsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const lastMod = data.timestamp ? data.timestamp.toDate() : new Date();
    return {
      url: `${BASE_URL}/property/${doc.id}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    };
  });

  return [...staticRoutes, ...dynamicRoutes];
}