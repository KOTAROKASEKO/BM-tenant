// app/sitemap.ts
export const dynamic = 'force-dynamic';
import { MetadataRoute } from 'next';
import { adminDb } from '../lib/firebase-admin'; // pathは環境に合わせて調整

const BASE_URL = 'https://bm-tenant.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 静的ページ (Reviews一覧を追加)
  const staticRoutes = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/reviews`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 }, // ★追加
  ];

  // 2. 物件詳細 (Existing Posts)
  const postsSnapshot = await adminDb.collection('posts')
    .where('status', '==', 'open')
    .orderBy('timestamp', 'desc')
    .get();

  const postRoutes = postsSnapshot.docs.map((doc) => ({
    url: `${BASE_URL}/property/${doc.id}`,
    lastModified: doc.data().timestamp?.toDate() || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. ★追加: コンドミニアムレビュー詳細 (Condominiums)
  const condosSnapshot = await adminDb.collection('condominiums').get();
  
  const condoRoutes = condosSnapshot.docs.map((doc) => ({
    url: `${BASE_URL}/reviews/${doc.id}`,
    lastModified: new Date(), // 更新日時フィールドがあればそれを使う
    changeFrequency: 'weekly' as const,
    priority: 0.9, // レビューは集客の柱なので優先度高く
  }));

  return [...staticRoutes, ...postRoutes, ...condoRoutes];
}