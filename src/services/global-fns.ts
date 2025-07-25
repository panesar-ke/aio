import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/middlewares/auth-middleware'
import z from 'zod'
import { requiredStringSchemaEntry } from '@/lib/schema-rules'
import db from '@/drizzle/db'
import { notifications } from '@/drizzle/schema'

export const createNotification = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    return z
      .object({
        title: z.string().min(1, 'Title is required'),
        path: requiredStringSchemaEntry('Path is required'),
        message: requiredStringSchemaEntry('Message is required'),
        userId: requiredStringSchemaEntry('User is required'),
        notificationType: requiredStringSchemaEntry(
          'Notification type is required',
        ),
      })
      .parse(data)
  })
  .handler(async ({ data }) => {
    await db.insert(notifications).values({
      title: data.title,
      path: data.path,
      message: data.message,
      addressedTo: data.userId,
      notificationType: data.notificationType,
    })
  })
