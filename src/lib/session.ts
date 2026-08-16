import 'server-only';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import type { SessionPayload } from '@/types/index.types';

import db from '@/drizzle/db';
import { sessions } from '@/drizzle/schema';
import { env } from '@/env/server';
import { UnauthorizedError } from '@/lib/permissions/errors';

const secretKey = env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('Failed to decrypt session:', error);
    throw new Error('Failed to decrypt session');
  }
}

export async function createSession(
  userId: string,
  options?: { policyCompliant?: boolean },
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const createdSession = await db
    .insert(sessions)
    .values({ expiresAt: expiresAt.toISOString(), userId })
    .returning({ id: sessions.id });

  const session = await encrypt({
    userId,
    sessionId: createdSession[0].id,
    expiresAt,
    policyCompliant: options?.policyCompliant,
  });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function updateSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(sessions)
    .set({ expiresAt: expiresAt.toISOString() })
    .where(eq(sessions.id, payload.sessionId as string));

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();

  const session = cookieStore.get('session')?.value;
  if (!session) {
    return null;
  }

  const payload = await decrypt(session);
  if (!payload) {
    return null;
  }
  await db.delete(sessions).where(eq(sessions.id, payload.sessionId as string));

  cookieStore.delete('session');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return null;
  }

  const payload = await decrypt(session);
  if (!payload) {
    return null;
  }

  return payload as SessionPayload;
}

export const getCurrentUserOrNull = cache(async () => {
  const session = await getSession().catch(() => null);
  if (!session) {
    return null;
  }

  // A signed JWT cannot be withdrawn, so the session row is what makes a
  // cookie usable: password resets and password changes delete a user's rows,
  // and a cookie whose row is gone stops working here rather than lingering
  // until its 7-day expiry. The proxy cannot make this check — it has no
  // database access — so a revoked cookie still reads as a session there and
  // is cleared by /api/auth/session-expired.
  const liveSession = await db.query.sessions.findFirst({
    columns: { id: true },
    where: (model, { eq }) => eq(model.id, session.sessionId),
  });

  if (!liveSession) {
    return null;
  }

  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      image: true,
      hasAdminPriviledges: true,
      name: true,
      email: true,
      userType: true,
      passwordPolicyVersion: true,
      passwordPolicyExemptUntil: true,
    },
    where: (model, { eq }) => eq(model.id, session.userId),
  });

  if (!user) return null;

  return { ...user, email: user.email as string };
});

type GetCurrentUserMode = 'page' | 'action' | 'api';

export const getCurrentUser = cache(
  async (mode: GetCurrentUserMode = 'page') => {
    const user = await getCurrentUserOrNull();
    if (!user) {
      if (mode === 'action' || mode === 'api') {
        throw new UnauthorizedError();
      }
      // Not /login directly: a revoked cookie still satisfies the proxy, which
      // bounces /login to /dashboard and lands back here in a loop. The route
      // drops the cookie first, then sends them on.
      return redirect('/api/auth/session-expired');
    }

    return user;
  }
);
