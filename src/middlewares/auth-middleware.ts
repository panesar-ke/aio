import { createMiddleware } from '@tanstack/react-start'
import { getSession } from '@tanstack/react-start/server'
import { env } from '@/env/server'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getSession({
      password: env.SESSION_SECRET,
    })

    if (!session.id) {
      throw new Error('Unauthorized')
    }

    return await next({
      context: {
        user: session.data,
      },
    })
  },
)
