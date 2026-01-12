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
    // Make sure this URL is your actual Tenant domain
    sitemap: 'https://bm-tenant.vercel.app/sitemap.xml',
  };
}