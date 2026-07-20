import { type NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { LOCALES, DEFAULT_LOCALE } from './lib/i18n';
import type { Route } from 'next';

function getLocale(req: NextRequest): string {
  const headers = {
    'accept-language': req.headers.get('accept-language') || 'en-US,en;q=0.9',
  };
  const languages = new Negotiator({ headers }).languages();

  try {
    return match(languages, LOCALES as unknown as string[], DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Skip static assets, internal paths, and manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || // matches favicon.ico, manifest.json, sw.js, etc.
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next();
  }

  // 2. Redirect `/` -> `/tl` (default locale)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }

  // 3. Handle QR Code URL target: `/b/[businessSlug]` -> `/[lang]/b/[businessSlug]`
  // Matches `/b/some-slug` or `/b/some-slug/confirm`
  const bMatch = pathname.match(/^\/b\/([^/]+)(.*)$/);
  if (bMatch) {
    const businessSlug = bMatch[1];
    const rest = bMatch[2] || '';
    const locale = getLocale(req);
    return NextResponse.redirect(
      new URL(`/${locale}/b/${businessSlug}${rest}${search}` as Route, req.url),
    );
  }

  // 4. Check if pathname has a supported locale prefix
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // If the pathname has no locale segment or an invalid locale segment,
  // we redirect it to use a valid locale segment.
  if (!pathnameHasLocale) {
    // Check if path starts with an invalid language code (e.g. `/fil/dashboard` or `/fr/...`)
    const pathSegments = pathname.split('/');
    const firstSegment = pathSegments[1];

    // If there is a first segment and it looks like a language segment (length 2-3) but is invalid
    if (firstSegment && firstSegment.length >= 2 && firstSegment.length <= 3) {
      const locale = getLocale(req);
      // Replace the invalid locale segment with the valid one
      pathSegments[1] = locale;
      const redirectPath = pathSegments.join('/');
      return NextResponse.redirect(
        new URL(`${redirectPath}${search}` as Route, req.url),
      );
    } else {
      // If it's a completely un-prefixed URL, add the locale prefix
      const locale = getLocale(req);
      return NextResponse.redirect(
        new URL(`/${locale}${pathname}${search}` as Route, req.url),
      );
    }
  }

  // 5. Auth Guard: Guard the dashboard
  const token = req.cookies.get('access_token')?.value;
  const isDashboardRoute = LOCALES.some((locale) =>
    pathname.startsWith(`/${locale}/dashboard`),
  );
  const isLoginRoute = LOCALES.some(
    (locale) =>
      pathname === `/${locale}/login` ||
      pathname.startsWith(`/${locale}/login/`),
  );

  if (isDashboardRoute && !token) {
    const locale =
      LOCALES.find((l) => pathname.startsWith(`/${l}/`)) || DEFAULT_LOCALE;
    return NextResponse.redirect(
      new URL(`/${locale}/login${search}` as Route, req.url),
    );
  }

  if (isLoginRoute && token) {
    const locale =
      LOCALES.find((l) => pathname.startsWith(`/${l}/`)) || DEFAULT_LOCALE;
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard${search}` as Route, req.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static ones
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
