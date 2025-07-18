// import 'server-only'
import { createId } from '@paralleldrive/cuid2'
import { eq, inArray } from 'drizzle-orm'
import type { MaterialRequisitionFormValues } from '@/features/procurement/utils/procurement.types'
import {
  getRequisition,
  getRequisitionNo,
} from '@/features/procurement/services/server-fns'
import db from '@/drizzle/db'
import { mrqDetails, mrqHeaders } from '@/drizzle/schema'
import { getUser } from '@/features/auth/server-functions'

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
