import z from 'zod'
import { logger, schemaTask } from '@trigger.dev/sdk/v3'
import {
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules'
// import axios from '@/lib/axios'
import { createNotification } from '@/services/global-fns'
import { getUser } from '@/features/auth/server-functions'

export const sendOrderEmail = schemaTask({
  id: 'send-order-email',
  schema: z.object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email('Invalid email address'),
    orderNumber: requiredNumberSchemaEntry('Order number is required'),
    fileUrl: requiredStringSchemaEntry('File URL is required'),
  }),
  run: async (payload) => {
    logger.log('Sending order email')
    const user = await getUser()

    const res = await fetch('http://localhost:8000/api/send-order-mail', {
      method: 'POST',
      body: JSON.stringify({
        supplierEmail: payload.email,
        orderNumber: payload.orderNumber,
        s3Url: payload.fileUrl,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      await createNotification({
        data: {
          title: 'Order Email Failed',
          message: `Failed to send order email for order #${payload.orderNumber} to ${payload.email}`,
          path: '/api/send-order-mail',
          notificationType: 'error',
          userId: user.id,
        },
      })
      logger.error('Failed to send order email')
      throw new Error(`Failed to send order email: ${res.statusText}`)
    }

    logger.log('Order email sent successfully')
    return {
      message: 'Order email sent successfully',
    }

    // try {
    //   const { email, orderNumber, fileUrl } = payload

    //   await axios.post('/api/send-order-mail', {
    //     supplierEmail: email,
    //     orderNumber,
    //     s3Url: fileUrl,
    //   })

    //   return {
    //     message: 'Order email sent successfully',
    //   }
    // } catch (error) {
    //   logger.error('Failed to send order email', { error })

    //   try {
    //     logger.log('About to create notification…')
    //     await createNotification({
    //       data: {
    //         title: 'Order Email Failed',
    //         message: `Failed to send order email for order #${payload.orderNumber} to ${payload.email}`,
    //         path: '/api/send-order-mail',
    //         notificationType: 'error',
    //         userId: user.id,
    //       },
    //     })
    //     logger.log('Notification created successfully')
    //   } catch (notificationError) {
    //     logger.error('Failed to create notification', { notificationError })
    //   }

    //   throw new Error(
    //     `Failed to send order email: ${
    //       error instanceof Error ? error.message : 'Unknown error'
    //     }`,
    //   )
    // }
  },
})
