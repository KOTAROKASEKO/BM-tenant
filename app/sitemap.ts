export const dynamic = 'force-dynamic';
import { MetadataRoute } from 'next';
import { adminDb } from '../lib/firebase-admin';

// ★重要修正: ここを実際の運用ドメインに変更
const BASE_URL = 'https://bilikmatch.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = ['en', 'ja']; 
  let routes: MetadataRoute.Sitemap = [];

  try {
    // 1. 静的ページ (各言語分)
    for (const lang of languages) {
      routes.push({
        url: `${BASE_URL}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      });
      routes.push({
        url: `${BASE_URL}/${lang}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }

    // 2. 物件詳細 (Existing Posts)
    // エラー防止のため件数制限(limit)を追加
    const postsSnapshot = await adminDb.collection('posts')
      .where('status', '==', 'open')
      .limit(1000) 
      .get();

    postsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // timestampがない場合の対策
      const lastModified = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
      
      for (const lang of languages) {
        routes.push({
          url: `${BASE_URL}/${lang}/property/${doc.id}`,
          lastModified: lastModified,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    });

    // 3. レビュー詳細
    const condosSnapshot = await adminDb.collection('condominiums')
        .limit(1000)
        .get();
    
    condosSnapshot.docs.forEach((doc) => {
      for (const lang of languages) {
        routes.push({
          url: `${BASE_URL}/${lang}/reviews/${doc.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    // エラー時でも最低限のルートだけは返す
    return languages.map(lang => ({
        url: `${BASE_URL}/${lang}`,
        lastModified: new Date(),
    }));
  }

  return routes;
}