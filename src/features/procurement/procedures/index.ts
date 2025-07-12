import { and, asc, eq } from 'drizzle-orm'
import db from '@/drizzle/db'
import { products, projects } from '@/drizzle/schema'
import { protectedProcedure } from '@/integrations/trpc/init'
import { transformOptions } from '@/lib/helpers/formatters'

export const procurementProcedures = {
  selectableProducts: protectedProcedure.query(async () => {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.active, true)))
  }),
  selectableProjects: protectedProcedure.query(async () => {
    const dbProjects = await db
      .select({
        id: projects.id,
        name: projects.projectName,
      })
      .from(projects)
      .where(eq(projects.active, true))
      .orderBy(asc(projects.projectName))

    return transformOptions(dbProjects)
  }),
  mrqs: protectedProcedure.query(async () => {
    return []
  }),
}
