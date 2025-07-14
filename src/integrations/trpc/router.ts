import { createTRPCRouter } from '@/integrations/trpc/init'

export const trpcRouter = createTRPCRouter({})
export type TRPCRouter = typeof trpcRouter
