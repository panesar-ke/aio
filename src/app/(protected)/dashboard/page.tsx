import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import db from '@/drizzle/db';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Home() {
  const redirectPath = await getRedirectPage();

  if (redirectPath) {
    redirect(redirectPath);
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
