'use server';

import { and, eq, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import { notifications } from '@/drizzle/schema';
import { getCurrentUserOrNull } from '@/lib/session';

export const createNotification = async (data: {
  title: string;
  path: string;
  message: string;
  userId: string;
  notificationType: string;
  eventId?: string;
}) => {
  const query = db.insert(notifications).values({
    title: data.title,
    path: data.path,
    message: data.message,
    addressedTo: data.userId,
    notificationType: data.notificationType,
    eventId: data.eventId,
  });

  if (data.eventId) {
    await query.onConflictDoNothing({
      target: [
        notifications.addressedTo,
        notifications.notificationType,
        notifications.eventId,
      ],
      where: sql`${notifications.eventId} is not null`,
    });
    return;
  }

  await query;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const currentUser = await getCurrentUserOrNull();
  if (!currentUser) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.addressedTo, currentUser.id)
      )
    );
};

export const markAllNotificationsAsRead = async () => {
  const currentUser = await getCurrentUserOrNull();
  if (!currentUser) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.addressedTo, currentUser.id));
};
