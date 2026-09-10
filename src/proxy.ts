import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { type NextRequest, NextResponse } from 'next/server';

import type { SessionPayload } from '@/types/index.types';

import { env } from '@/env/server';
import {
  parsePolicyDeadline,
  shouldGate,
} from '@/features/auth/utils/password-policy';
import { decrypt } from '@/lib/session';

const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/inngest',
];

const aj = arcjet({
  key: env.ARCJET_KEY,
  // Keyed on the pair, not on `sessionId` alone. Every unauthenticated request
  // resolves to the same `'anonymous'` session, so a lone characteristic put
  // the whole internet in one bucket — one client could exhaust it and 403
  // every login company-wide. `ip.src` is Arcjet's own value, so it cannot be
  // spoofed through a request header the way `x-forwarded-for` can.
  // `sessionId` stays: it is what buckets signed-in staff individually rather
  // than collapsing the office NAT into a single IP bucket.
  characteristics: ['ip.src', 'sessionId'],
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

  // Fail open. Arcjet being unreachable must not take sign-in down with it, and
  // login no longer depends on it alone: the per-identifier throttle in
  // login-throttle.ts stands in front of every credential check regardless of
  // what this decision says.
  // Alert on this line — it means the whole edge layer is silently off.
  if (decision.isErrored()) {
    console.error('ARCJET_DECISION_ERROR', {
      message: decision.reason.message,
      path,
    });
  } else if (decision.isDenied()) {
    // The body stays empty either way: telling a caller which rule stopped them
    // is free reconnaissance. Retry-After is different — it is advice a blocked
    // legitimate client can act on, and it reveals nothing beyond the window
    // length already implied by the limit.
    const headers = new Headers();

    if (decision.reason.isRateLimit()) {
      const resetSeconds =
        decision.reason.resetTime === undefined
          ? decision.reason.reset
          : Math.max(
              0,
              Math.ceil(
                (decision.reason.resetTime.getTime() - Date.now()) / 1000,
              ),
            );

      headers.set('Retry-After', String(resetSeconds));
    }

    return new Response(null, { headers, status: 403 });
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

  const deadline = parsePolicyDeadline(process.env.PASSWORD_POLICY_DEADLINE);

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
      // Per-user exemptions are not in the JWT and the proxy cannot reach the
      // database. A user gated on a stale claim is released by
      // releasePolicyGateAction when they land on /change-password.
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
