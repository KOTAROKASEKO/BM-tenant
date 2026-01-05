'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateTenantSitemap() {
  // This purges the cache for https://bilikmatch.com/sitemap.xml
  revalidatePath('/sitemap.xml'); 
  console.log('Tenant sitemap revalidated');
}