import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'
import db from '@/drizzle/db'
import { procurementProcedures } from '@/features/procurement/procedures'

export const trpcRouter = createTRPCRouter({
  forms: protectedProcedure.query(async () => {
    // TODO: By user
    return db.query.forms.findMany({
      columns: { id: true, formName: true, path: true, module: true },
      orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
    })
  }),
  procurement: procurementProcedures,
})
export type TRPCRouter = typeof trpcRouter
