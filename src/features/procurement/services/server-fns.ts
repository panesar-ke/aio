import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, getTableColumns } from 'drizzle-orm'
import { authMiddleware } from '@/middlewares/auth-middleware'
import db from '@/drizzle/db'
import {
  mrqHeaders,
  products,
  projects,
  services,
  users,
} from '@/drizzle/schema'
import { transformOptions } from '@/lib/helpers/formatters'
import { materialRequisitionFormSchema } from '@/features/procurement/utils/schemas'
import {
  createRequisition as createRequisitionAction,
  updateRequisitionUrl as updateRequisitionUrlAction,
  deleteRequisition as deleteRequisitionAction,
} from '@/features/procurement/services/actions'

export const getMaterialRequisitions = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async () => {
    return await db
      .select({
        ...getTableColumns(mrqHeaders),
        createdBy: users.name,
      })
      .from(mrqHeaders)
      .where(eq(mrqHeaders.isDeleted, false))
      .innerJoin(users, eq(mrqHeaders.createdBy, users.id))
      .orderBy(desc(mrqHeaders.createdOn))
      .limit(100)
  })

export const getSelectableProducts = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async () => {
    const dbProducts = await db
      .select({
        id: products.id,
        name: products.productName,
      })
      .from(products)
      .where(and(eq(products.active, true)))
      .orderBy(asc(products.productName))

    return transformOptions(dbProducts)
  })

export const getSelectableServices = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async () => {
    const dbServices = await db
      .select({
        id: services.id,
        name: services.serviceName,
      })
      .from(services)
      .where(and(eq(services.active, true)))
      .orderBy(asc(services.serviceName))

    return transformOptions(dbServices)
  })

export const getSelectableProjects = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async () => {
    const dbProjects = await db
      .select({
        id: projects.id,
        name: projects.projectName,
      })
      .from(projects)
      .where(eq(projects.active, true))
      .orderBy(asc(projects.projectName))

    return transformOptions(dbProjects)
  })

export const getRequisitionNo = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async () => {
    const lastMrq = await db
      .select({
        documentNo: mrqHeaders.id,
      })
      .from(mrqHeaders)
      .orderBy(desc(mrqHeaders.id))
      .limit(1)

    if (!lastMrq.length) return 1
    return lastMrq[0].documentNo + 1
  })

export const createRequisition = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .validator((data: { values: unknown; id?: string }) => {
    const { success, data: parsedData } =
      materialRequisitionFormSchema.safeParse(data.values)
    if (!success) {
      throw new Error('Invalid data')
    }
    return { parsedValues: parsedData, id: data.id }
  })
  .handler(async ({ data }) => {
    try {
      return await createRequisitionAction({
        values: data.parsedValues,
        id: data.id,
      })
    } catch (error) {
      console.error(error)
      return {
        error: true,
        message: 'Failed to create requisition',
        data: null,
      }
    }
  })

export const getRequisition = createServerFn()
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    return await db.query.mrqHeaders.findFirst({
      where: (model, { eq: equal }) => equal(model.reference, data),
      with: {
        mrqDetails: {
          with: {
            product: {
              columns: { id: true, productName: true, buyingPrice: true },
              with: { uom: { columns: { abbreviation: true } } },
            },
            service: {
              columns: { id: true, serviceName: true, serviceFee: true },
            },
            project: { columns: { id: true, projectName: true } },
          },
        },
      },
    })
  })

export const updateRequisitionUrl = createServerFn({ method: 'POST' })
  .validator((data: { fileUrl: string; requisitionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      return await updateRequisitionUrlAction({
        fileUrl: data.fileUrl,
        requisitionId: data.requisitionId,
      })
    } catch (error) {
      console.error(error)
      return {
        error: true,
        message: 'Failed to update requisition URL',
        data: null,
      }
    }
  })

export const deleteRequisition = createServerFn({ method: 'POST' })
  .validator((data: string) => data)
  .handler(async ({ data }) => {
    try {
      return await deleteRequisitionAction({
        requisitionId: data,
      })
    } catch (error) {
      console.error(error)
      return {
        error: true,
        message: 'Failed to delete requisition',
      }
    }
  })
