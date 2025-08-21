import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/env/server';
import type { SessionPayload } from '@/types/index.types';
import { cookies } from 'next/headers';
import db from '@/drizzle/db';
import { sessions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { redirect } from 'next/navigation';

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

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const createdSession = await db
    .insert(sessions)
    .values({ expiresAt: expiresAt.toISOString(), userId })
    .returning({ id: sessions.id });

  const session = await encrypt({
    userId,
    sessionId: createdSession[0].id,
    expiresAt,
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

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    return redirect('/login');
  }

  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      image: true,
      hasAdminPriviledges: true,
      name: true,
      email: true,
      userType: true,
    },
    where: (model, { eq }) => eq(model.id, session.userId),
  });

  if (!user) return redirect('/login');

  return { ...user, email: user.email as string };
});
