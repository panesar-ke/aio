import type { Metadata, Route } from 'next';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import db from '@/drizzle/db';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DashboardRedirect />
    </Suspense>
  );
}

// The heading renders inside the boundary, not beside it: anything in the
// static shell paints before the redirect resolves, so every user with a
// defaultMenu would see an empty Dashboard heading flash on the way out.
async function DashboardRedirect() {
  await connection();
  const redirectPath = await getRedirectPage();

  if (redirectPath) {
    redirect(redirectPath as Route);
  }

  return <h1>Dashboard</h1>;
}

async function getRedirectPage(): Promise<string | null> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return null;
    }

    const userData = await db.query.users.findFirst({
      columns: { defaultMenu: true },
      where: (users, { eq }) => eq(users.id, user.id),
    });

    return userData?.defaultMenu || null;
  } catch (error) {
    console.error('Error fetching user redirect page:', error);
    return null;
  }
}
