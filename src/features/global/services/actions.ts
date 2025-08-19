'use server';
import db from '@/drizzle/db';
import { notifications } from '@/drizzle/schema';

export const createNotification = async (data: {
  title: string;
  path: string;
  message: string;
  userId: string;
  notificationType: string;
  eventId?: string;
}) => {
  await db.insert(notifications).values({
    title: data.title,
    path: data.path,
    message: data.message,
    addressedTo: data.userId,
    notificationType: data.notificationType,
    eventId: data.eventId,
  });
};
