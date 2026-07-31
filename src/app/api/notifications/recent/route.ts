import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { notifications } from '@/drizzle/schema';
import { getCurrentUserOrNull } from '@/lib/session';

export async function GET(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUserOrNull();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.addressedTo, currentUser.id))
      .orderBy(desc(notifications.createdOn))
      .limit(5);

    const unreadCountResult = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.addressedTo, currentUser.id),
          eq(notifications.isRead, false)
        )
      );

    return NextResponse.json({
      notifications: userNotifications,
      totalCount: unreadCountResult.length,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
