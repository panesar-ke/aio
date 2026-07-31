import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { notifications } from '@/drizzle/schema';
import { getCurrentUserOrNull } from '@/lib/session';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUserOrNull();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') ?? 'all';

    const conditions = [eq(notifications.addressedTo, currentUser.id)];
    if (filter === 'unread') {
      conditions.push(eq(notifications.isRead, false));
    }

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdOn));

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
      notifications: allNotifications,
      unreadCount: unreadCountResult.length,
      totalCount: allNotifications.length,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
