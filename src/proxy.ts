import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { type NextRequest, NextResponse } from 'next/server';

import type { SessionPayload } from '@/types/index.types';

import { shouldGate } from '@/features/auth/utils/password-policy';
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

  const deadline = process.env.PASSWORD_POLICY_DEADLINE
    ? new Date(process.env.PASSWORD_POLICY_DEADLINE)
    : null;

  // `/change-password` must stay reachable or the gate redirects to itself.
  const isPolicyExempt = path === '/change-password' || path.startsWith('/api/');

  if (
    hasSession &&
    !isPolicyExempt &&
    shouldGate({
      // A session predating the policy has no claim; treat it as compliant and
      // let the next login settle it, rather than gating on stale data.
      compliant: session?.policyCompliant !== false,
      deadline,
      // Per-user exemptions are not in the JWT; they take effect at next login.
      exemptUntil: null,
      now: new Date(),
    })
  ) {
    return NextResponse.redirect(new URL('/change-password', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
