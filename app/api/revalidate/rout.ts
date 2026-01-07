import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // セキュリティのため、シークレットトークンをチェック
  if (secret !== process.env.MY_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  try {
    // テナント側の sitemap.xml を再検証
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}