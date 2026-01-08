'use server';

export async function revalidateTenantSitemap() {
  const TENANT_API_URL = 'https://bm-tenant.vercel.app/api/revalidate';
  const SECRET = process.env.MY_SECRET_TOKEN; // テナント側と同じトークン

  try {
    const response = await fetch(`${TENANT_API_URL}?secret=${SECRET}`, {
      method: 'POST',
    });

    if (response.ok) {
      console.log('External Tenant sitemap revalidated successfully');
    } else {
      console.error('Failed to revalidate external sitemap');
    }
  } catch (error) {
    console.error('Error calling revalidation API:', error);
  }
}