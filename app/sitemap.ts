export const dynamic = 'force-dynamic';
import { MetadataRoute } from 'next';
import { adminDb } from '../lib/firebase-admin';

// 本番サイトドメイン (bilikmatch.com)
const BASE_URL = 'https://bilikmatch.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = ['en', 'ja']; 
  let routes: MetadataRoute.Sitemap = [];

  try {
    // 1. 静的ページ (各言語分)
    // Note: Language alternates are handled via HTML hreflang tags, not in sitemap
    for (const lang of languages) {
      routes.push({
        url: `${BASE_URL}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: lang === 'en' ? 1.0 : 0.9, // English as primary
      });
      routes.push({
        url: `${BASE_URL}/${lang}/reviews`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: lang === 'en' ? 0.9 : 0.8,
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
          priority: lang === 'en' ? 0.8 : 0.7,
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
          priority: lang === 'en' ? 0.9 : 0.8,
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