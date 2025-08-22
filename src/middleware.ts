import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';

const publicRoutes = ['/login', '/forgot-password', '/api/inngest'];

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:MONITOR',
        'CATEGORY:PREVIEW',
        'CATEGORY:VERCEL',
      ],
    }),
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: 100,
    }),
  ],
});

export default async function middleware(req: NextRequest) {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return new Response(null, { status: 403 });
  }

  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const sessionCookie = req.cookies.get('session');
  const hasSession = sessionCookie?.value;

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
