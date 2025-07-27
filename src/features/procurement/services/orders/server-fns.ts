import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import db from '@/drizzle/db'
import {
  ordersHeader,
  users,
  vendors,
  ordersDetails,
  mrqDetails,
  products,
  services,
} from '@/drizzle/schema'
import { authMiddleware } from '@/middlewares/auth-middleware'
import { transformOptions } from '@/lib/helpers/formatters'
import { orderSchema } from '@/features/procurement/utils/schemas'
import {
  createOrder,
  updateOrderUrl,
} from '@/features/procurement/services/actions'
import type { AxiosResponse } from 'axios'
import axios from '@/lib/axios'
import type { OrderData } from '@/features/procurement/utils/procurement.types'
import { isValidEmail } from '@/lib/utils'

export const getPurchaseOrderNo = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const lastOrder = await db
      .select({
        documentNo: ordersHeader.id,
      })
      .from(ordersHeader)
      .orderBy(desc(ordersHeader.id))
      .limit(1)

    if (!lastOrder.length) return 1
    return lastOrder[0].documentNo + 1
  })

export const getPendingRequests = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const requests = await db
      .select({
        id: mrqDetails.id,
        itemName: products.productName,
        serviceName: services.serviceName,
        requestId: mrqDetails.requestId,
        itemRate: products.buyingPrice,
        serviceRate: services.serviceFee,
        qty: mrqDetails.qty,
        projectId: mrqDetails.projectId,
        itemId: mrqDetails.itemId,
        serviceId: mrqDetails.serviceId,
      })
      .from(mrqDetails)
      .where(eq(mrqDetails.linked, false))
      .leftJoin(products, eq(mrqDetails.itemId, products.id))
      .leftJoin(services, eq(mrqDetails.serviceId, services.id))

    return requests.map((req) => ({
      id: req.id,
      type: req.itemName ? 'item' : ('service' as 'item' | 'service'),
      itemName: req.itemName || req.serviceName,
      requestId: req.requestId.toString(),
      qty: req.qty,
      rate: req.itemName ? req.itemRate : req.serviceRate,
      projectId: req.projectId,
      itemId: req.itemId,
      serviceId: req.serviceId,
    }))
  })

export const getActiveVendors = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const activeVendors = await db
      .select({
        id: vendors.id,
        name: vendors.vendorName,
      })
      .from(vendors)
      .where(eq(vendors.active, true))

    return transformOptions(activeVendors)
  })

export const getPurchaseOrders = createServerFn()
  .middleware([authMiddleware])
  .validator((q?: string) => q)
  .handler(async ({ data }) => {
    const orders = await db
      .select({
        id: ordersHeader.id,
        reference: ordersHeader.reference,
        orderDate: ordersHeader.documentDate,
        createdBy: users.name,
        vendor: vendors.vendorName,
        billNo: ordersHeader.billNo,
        totalAmount: sql<number>`SUM(${ordersDetails.amountInclusive})`,
        createdAt: ordersHeader.createdOn,
      })
      .from(ordersHeader)
      .where(
        and(
          eq(ordersHeader.isDeleted, false),
          data
            ? or(
                ilike(ordersHeader.billNo, `%${data}%`),
                sql`${ordersHeader.documentDate}::text ILIKE ${`%${data}%`}`,
                ilike(users.name, `%${data}%`),
                ilike(vendors.vendorName, `%${data}%`),
                sql`${ordersHeader.id}::text ILIKE ${`%${data}%`}`,
              )
            : undefined,
        ),
      )
      .innerJoin(users, eq(ordersHeader.createdBy, users.id))
      .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .groupBy(
        ordersHeader.id,
        ordersHeader.documentDate,
        users.name,
        vendors.vendorName,
        ordersHeader.billNo,
        ordersHeader.createdOn,
      )
      .orderBy(desc(ordersHeader.createdOn))
      .limit(100)

    return orders
  })

export const getPurchaseOrder = createServerFn()
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const order = await db.query.ordersHeader.findFirst({
      where: (model, { eq: equal }) => equal(model.reference, data),
      columns: {
        vendorId: false,
        vehicleId: false,
        mrqId: false,
        isDeleted: false,
        createdBy: false,
      },
      with: {
        vendor: { columns: { active: false } },
        user: { columns: { name: true } },
        ordersDetails: {
          with: {
            product: {
              columns: { id: true, productName: true },
              with: { uom: { columns: { abbreviation: true } } },
            },
            service: { columns: { id: true, serviceName: true } },
          },
        },
      },
    })

    if (!order) {
      throw notFound()
    }

    return order
  })

export const createPurchaseOrder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: {
      values: unknown
      submitType: 'SUBMIT' | 'SUBMIT_SEND'
      id?: string
    }) => {
      const { success, data: parsedData } = orderSchema.safeParse(data.values)
      if (!success) {
        throw new Error('Invalid data')
      }
      return {
        parsedValues: parsedData,
        id: data.id,
        submitType: data.submitType,
      }
    },
  )
  .handler(async ({ data }) => {
    try {
      return await createOrder({
        values: data.parsedValues,
        submitType: data.submitType,
        id: data.id,
      })
    } catch (error) {
      console.error(error)
      return {
        error: true,
        message: 'Failed to create order',
        data: null,
      }
    }
  })

export const updatePurchaseOrderUrl = createServerFn({ method: 'POST' })
  .validator((data: { fileUrl: string; orderId: string }) => data)
  .handler(async ({ data }) => {
    try {
      return await updateOrderUrl({
        fileUrl: data.fileUrl,
        orderId: data.orderId,
      })
    } catch (error) {
      console.error(error)
      return {
        error: true,
        message: 'Failed to update order URL',
        data: null,
      }
    }
  })

export const generateOrderUrl = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { values: OrderData; orderId: string }) => data)
  .handler(async ({ data }) => {
    const res: AxiosResponse<{
      success: boolean
      message: string
      url: string
    }> = await axios.post(`/api/generate-purchase-order`, data.values)

    if (!res.data.success) {
      return {
        error: true,
        message: res.data.message,
        data: null,
      }
    }

    await updatePurchaseOrderUrl({
      data: { fileUrl: res.data.url, orderId: data.orderId },
    })

    return {
      error: false,
      data: res.data.url,
    }
  })

export const sendOrderEmailAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: string) => data)
  .handler(async ({ data }) => {
    const {
      vendor: { email },
      id,
      fileUrl,
    } = await getPurchaseOrder({ data })
    if (!email) {
      return {
        error: true,
        message: 'Vendor email not found',
      }
    }
    if (!isValidEmail(email)) {
      return {
        error: true,
        message: 'Invalid vendor email address',
      }
    }

    if (!fileUrl) {
      return {
        error: true,
        message: 'Order URL not found',
      }
    }

    try {
      await axios.post('/api/send-order-mail', {
        supplierEmail: email,
        orderNumber: id,
        s3Url: fileUrl,
      })

      return {
        error: null,
        message: 'Email sent successfully',
      }
    } catch (error) {
      console.error('Error sending order email:', error)
      return {
        error: true,
        message: 'Failed to send order email',
      }
    }
  })
