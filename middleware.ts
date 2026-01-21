import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

let locales = ["en", "ja"];
let defaultLocale = "en"; // デフォルトは英語

function getLocale(request: NextRequest): string {
  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // すでに言語パスがある場合、またはAPIや静的ファイルへのアクセスの場合は何もしない
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Pass pathname to the request for canonical URL generation
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // ルートパス（/）の場合は言語を検出してリダイレクト
  if (pathname === '/') {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}`;
    // Use 308 permanent redirect for SEO (preserves method)
    return NextResponse.redirect(request.nextUrl, { status: 308 });
  }

  // その他のパスの場合も言語を検出してリダイレクト
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // Use 308 permanent redirect for SEO (preserves method)
  return NextResponse.redirect(request.nextUrl, { status: 308 });
}

export const config = {
  // api, _next, 画像ファイルなどを除外する設定
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};