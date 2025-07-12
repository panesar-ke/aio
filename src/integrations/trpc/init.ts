import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { useAppSession } from '@/lib/session'

const t = initTRPC.create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const { data } = await useAppSession()
  if (!data.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      user: data,
    },
  })
})
