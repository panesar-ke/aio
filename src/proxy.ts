import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { type NextRequest, NextResponse } from 'next/server';

import type { SessionPayload } from '@/types/index.types';

import { decrypt } from '@/lib/session';

const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/inngest',
];

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['sessionId'],
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

async function getValidatedSession(
  sessionCookie: string | undefined
): Promise<SessionPayload | null> {
  if (!sessionCookie) {
    return null;
  }

  try {
    return (await decrypt(sessionCookie)) as SessionPayload;
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/inngest') || path.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('session')?.value;
  const session = await getValidatedSession(sessionCookie);
  const sessionId = session?.sessionId ?? 'anonymous';

  const decision = await aj.protect(req, { sessionId });

  if (decision.isDenied()) {
    return new Response(null, { status: 403 });
  }

  // Prefix match, so /reset-password/<token> is public while
  // /reset-password-admin is not.
  const isPublicRoute = publicRoutes.some(
    route => path === route || path.startsWith(`${route}/`)
  );
  const hasSession = Boolean(session);

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
