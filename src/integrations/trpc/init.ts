import { getSession } from '@tanstack/react-start/server'
import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { env } from '@/env/server'

// import { useAppSession } from '@/lib/session'

const t = initTRPC.create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const session = await getSession({
    password: env.SESSION_SECRET,
  })
  if (!session.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      user: session.data,
    },
  })
})
