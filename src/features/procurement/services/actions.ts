// import 'server-only'
import { createId } from '@paralleldrive/cuid2'
import { eq, inArray } from 'drizzle-orm'
import type {
  MaterialRequisitionFormValues,
  OrderFormValues,
} from '@/features/procurement/utils/procurement.types'
import {
  getRequisition,
  getRequisitionNo,
} from '@/features/procurement/services/server-fns'
import db from '@/drizzle/db'
import {
  mrqDetails,
  mrqHeaders,
  ordersDetails,
  ordersHeader,
  notifications,
} from '@/drizzle/schema'
import { getUser } from '@/features/auth/server-functions'
import { orderSchema } from '@/features/procurement/utils/schemas'
import {
  getPurchaseOrder,
  getPurchaseOrderNo,
} from '@/features/procurement/services/orders/server-fns'
import {
  calculateDiscount,
  calculateVatValues,
} from '@/features/procurement/utils/calculators'

if (typeof window !== 'undefined') {
  throw new Error('actions.ts should not be imported on the client')
}

export async function createRequisition({
  values,
  id,
}: {
  values: MaterialRequisitionFormValues
  id?: string
}) {
  const user = await getUser()
  const documentNo = id
    ? (await getRequisition({ data: id }))?.id
    : await getRequisitionNo()
  if (!documentNo)
    return {
      error: true,
      message: 'Unable to generate document number',
      data: null,
    }

  const reference = await db.transaction(async (tx) => {
    const { details, documentDate } = values

    const formattedDetails = details.map((detail) => ({
      headerId: documentNo,
      requestId: detail.requestId,
      projectId: detail.projectId,
      itemId: detail.type === 'item' ? detail.itemOrServiceId : null,
      serviceId: detail.type === 'service' ? detail.itemOrServiceId : null,
      qty: detail.qty.toString(),
      unitId: 1,
      remarks: detail.remarks || null,
    }))

    const ref = await tx
      .insert(mrqHeaders)
      .values({
        id: documentNo,
        reference: createId(),
        documentDate: new Date(documentDate).toISOString(),
        createdBy: user.id,
      })
      .onConflictDoUpdate({
        target: mrqHeaders.id,
        set: {
          documentDate: new Date(documentDate).toISOString(),
        },
      })
      .returning({ reference: mrqHeaders.reference })

    if (id) {
      const requestIds = await db.query.mrqDetails
        .findMany({
          columns: { requestId: true },
          where: (model, { eq }) => eq(model.headerId, documentNo),
        })
        .then((res) => res.map((req) => req.requestId))

      const existingIds = formattedDetails.filter((detail) =>
        requestIds.includes(detail.requestId),
      )
      const nonExistingIds = formattedDetails.filter(
        (detail) => !requestIds.includes(detail.requestId),
      )

      const removeIds = requestIds.filter(
        (reqId) =>
          !formattedDetails.map((detail) => detail.requestId).includes(reqId),
      )

      if (removeIds.length > 0) {
        await tx
          .delete(mrqDetails)
          .where(inArray(mrqDetails.requestId, removeIds))
      }

      if (nonExistingIds.length > 0) {
        await tx.insert(mrqDetails).values(nonExistingIds)
      }

      existingIds.forEach(async (detail) => {
        await tx
          .update(mrqDetails)
          .set({
            qty: detail.qty.toString(),
            itemId: detail.itemId,
            remarks: detail.remarks,
            serviceId: detail.serviceId,
            projectId: detail.projectId,
          })
          .where(eq(mrqDetails.requestId, detail.requestId))
      })
    } else {
      await tx.insert(mrqDetails).values(formattedDetails)
    }

    return ref[0].reference
  })

  return {
    error: false,
    message: 'Requisition saved successfully',
    data: reference,
  }
}

export async function updateRequisitionUrl({
  fileUrl,
  requisitionId,
}: {
  fileUrl: string
  requisitionId: string
}) {
  await db
    .update(mrqHeaders)
    .set({ fileUrl })
    .where(eq(mrqHeaders.reference, requisitionId))

  return {
    error: false,
    message: 'Requisition URL updated successfully',
  }
}

export const deleteRequisition = async ({
  requisitionId,
}: {
  requisitionId: string
}) => {
  const requisition = await getRequisition({ data: requisitionId })
  if (!requisition) {
    return {
      error: true,
      message: 'Requisition not found',
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(mrqDetails).where(eq(mrqDetails.headerId, requisition.id))
    await tx.delete(mrqHeaders).where(eq(mrqHeaders.reference, requisitionId))
  })

  return {
    error: false,
    message: 'Requisition deleted successfully',
  }
}

export const createOrder = async ({
  values,
  submitType,
  id,
}: {
  values: OrderFormValues
  submitType: 'SUBMIT' | 'SUBMIT_SEND'
  id?: string
}) => {
  const { success, data, error } = orderSchema.safeParse(values)
  if (!success) {
    console.log(error)
    return {
      error: true,
      message: 'Validation failed. Check all required fields and try again.',
    }
  }

  const orderNo = id
    ? (await getPurchaseOrder({ data: id }))?.id
    : await getPurchaseOrderNo()
  if (!orderNo)
    return {
      error: true,
      message: 'Unable to generate order number',
    }

  const {
    details,
    documentDate,
    vendor,
    invoiceDate,
    invoiceNo,
    vat,
    vatType,
  } = data

  const reference = await db.transaction(async (tx) => {
    const ref = await tx
      .insert(ordersHeader)
      .values({
        id: orderNo,
        reference: createId(),
        documentDate: documentDate.toISOString(),
        vendorId: vendor,
        billDate: invoiceDate ? new Date(invoiceDate).toISOString() : null,
        billNo: invoiceNo,
        vatType,
        vatId: vatType !== 'NONE' ? 1 : null,
        createdBy: (await getUser()).id,
      })
      .onConflictDoUpdate({
        target: ordersHeader.id,
        set: {
          documentDate: documentDate.toISOString(),
          vendorId: vendor,
          billDate: invoiceDate ? new Date(invoiceDate).toISOString() : null,
          billNo: invoiceNo,
          vatType,
          vatId: vatType !== 'NONE' ? 1 : null,
        },
      })
      .returning({ reference: ordersHeader.reference })

    if (id) {
      await tx.delete(ordersDetails).where(eq(ordersDetails.headerId, orderNo))
      details.forEach(async (detail) => {
        await tx
          .update(mrqDetails)
          .set({ linked: false })
          .where(eq(mrqDetails.requestId, +detail.requestId))
      })
    }

    details.forEach(async (detail) => {
      await tx
        .update(mrqDetails)
        .set({ linked: true })
        .where(eq(mrqDetails.requestId, +detail.requestId))
    })

    const formattedDetails = details.map(
      ({
        itemOrServiceId,
        projectId,
        qty,
        rate,
        requestId,
        discount,
        discountType,
        type,
      }) => {
        const gross = Number(qty) * parseFloat(rate.toString())
        const discountedAmount = calculateDiscount(
          discountType ?? 'NONE',
          discount ?? 0,
          gross,
        )
        const subTotal = gross - discountedAmount
        const vatValues = calculateVatValues(vatType, subTotal, vat ?? 0)
        return {
          headerId: orderNo,
          requestId: Number(requestId),
          projectId,
          itemId: type === 'item' ? itemOrServiceId : null,
          serviceId: type === 'service' ? itemOrServiceId : null,
          qty: qty.toString(),
          rate: rate.toString(),
          discountType: discountType ?? 'NONE',
          discount: discount ? discount.toString() : '0',
          discountedAmount: discountedAmount.toString(),
          amountExclusive: vatValues.exclusive.toString(),
          vat: vatValues.vatValue.toString(),
          amountInclusive: vatValues.inclusive.toString(),
        }
      },
    )

    await tx.insert(ordersDetails).values(formattedDetails)

    return ref[0].reference
  })

  return {
    error: false,
    message: 'Order saved successfully',
    data: reference,
  }
}

export async function updateOrderUrl({
  fileUrl,
  orderId,
}: {
  fileUrl: string
  orderId: string
}) {
  await db
    .update(ordersHeader)
    .set({ fileUrl })
    .where(eq(ordersHeader.reference, orderId))

  return {
    error: false,
    message: 'Order URL updated successfully',
  }
}

export const createNotification = async (data: {
  title: string
  path: string
  message: string
  userId: string
  notificationType: string
}) => {
  await db.insert(notifications).values({
    title: data.title,
    path: data.path,
    message: data.message,
    addressedTo: data.userId,
    notificationType: data.notificationType,
  })
}
