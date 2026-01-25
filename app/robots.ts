import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',            // ✅ Allow indexing for tenants
      disallow: [
        '/profile/',         // Keep user profiles private
        '/chat/',            // Keep chats private
        '/api/',             // Block API routes
      ],
    },
    sitemap: 'https://bilikmatch.com/sitemap.xml',
  };
}