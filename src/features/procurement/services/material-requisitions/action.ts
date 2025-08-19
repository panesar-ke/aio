'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { isAxiosError, type AxiosResponse } from 'axios';
import type { MaterialRequisitionFormValues } from '@/features/procurement/utils/procurement.types';
import {
  getRequisition,
  getRequisitionNo,
} from '@/features/procurement/services/material-requisitions/data';
import db from '@/drizzle/db';
import { mrqDetails, mrqHeaders } from '@/drizzle/schema';
import { getCurrentUser } from '@/lib/session';
import { revalidateMaterialRequisitions } from '@/features/procurement/utils/cache';
import axios from '@/lib/axios';
import { apiErrorHandler } from '@/lib/utils';

export async function createRequisition({
  values,
  submitType,
  id,
}: {
  values: MaterialRequisitionFormValues;
  submitType: 'SUBMIT' | 'SUBMIT_GENERATE';
  id?: string;
}) {
  const user = await getCurrentUser();
  const documentNo = id
    ? (await getRequisition(id))?.id
    : await getRequisitionNo();
  if (!documentNo)
    return {
      error: true,
      message: 'Unable to generate document number',
      data: null,
    };

  const reference = await db.transaction(async tx => {
    const { details, documentDate } = values;

    const formattedDetails = details.map(detail => ({
      headerId: documentNo,
      requestId: detail.requestId,
      projectId: detail.projectId,
      itemId: detail.type === 'item' ? detail.itemOrServiceId : null,
      serviceId: detail.type === 'service' ? detail.itemOrServiceId : null,
      qty: detail.qty.toString(),
      unitId: 1,
      remarks: detail.remarks || null,
    }));

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
          fileUrl: null,
        },
      })
      .returning({ reference: mrqHeaders.reference });

    if (id) {
      const requestIds = await db.query.mrqDetails
        .findMany({
          columns: { requestId: true },
          where: (model, { eq }) => eq(model.headerId, documentNo),
        })
        .then(res => res.map(req => req.requestId));

      const existingIds = formattedDetails.filter(detail =>
        requestIds.includes(detail.requestId)
      );
      const nonExistingIds = formattedDetails.filter(
        detail => !requestIds.includes(detail.requestId)
      );

      const removeIds = requestIds.filter(
        reqId =>
          !formattedDetails.map(detail => detail.requestId).includes(reqId)
      );

      if (removeIds.length > 0) {
        await tx
          .delete(mrqDetails)
          .where(inArray(mrqDetails.requestId, removeIds));
      }

      if (nonExistingIds.length > 0) {
        await tx.insert(mrqDetails).values(nonExistingIds);
      }

      existingIds.forEach(async detail => {
        await tx
          .update(mrqDetails)
          .set({
            qty: detail.qty.toString(),
            itemId: detail.itemId,
            remarks: detail.remarks,
            serviceId: detail.serviceId,
            projectId: detail.projectId,
          })
          .where(eq(mrqDetails.requestId, detail.requestId));
      });
    } else {
      await tx.insert(mrqDetails).values(formattedDetails);
    }

    return ref[0].reference;
  });

  revalidateMaterialRequisitions(reference);

  if (submitType === 'SUBMIT_GENERATE') {
    redirect(`/procurement/purchase-order/new?requisition=${reference}`);
  }

  redirect(`/procurement/material-requisition/${reference}/details`);
}

type ActionState = {
  success: boolean;
  error: string | null;
  fileUrl: string | null;
};

export async function generateRequisitionAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const requisitionId = formData.get('requisitionId') as string;

    const requisition = await getRequisition(requisitionId);

    if (!requisitionId) {
      return {
        success: false,
        error: 'Requisition ID is required',
        fileUrl: null,
      };
    }

    const formattedData = {
      documentDate: requisition.documentDate,
      requisitionNumber: requisition.id.toString(),
      items: requisition.mrqDetails.map(
        ({ product, service, project, itemId, qty }) => ({
          itemName: itemId
            ? product?.productName ?? ''
            : service?.serviceName ?? '',
          quantity: qty,
          unit: itemId ? product?.uom?.abbreviation ?? 'DEF' : 'DEF',
          rate: itemId ? product?.buyingPrice ?? 0 : service?.serviceFee ?? 0,
          project: project.projectName,
        })
      ),
    };

    const res: AxiosResponse<{
      success: boolean;
      message: string;
      url: string;
    }> = await axios.post(`/generate-requisition`, formattedData);

    await db
      .update(mrqHeaders)
      .set({ fileUrl: res.data.url })
      .where(eq(mrqHeaders.reference, requisitionId));

    revalidateMaterialRequisitions(requisitionId);

    return {
      success: true,
      error: null,
      fileUrl: res.data.url,
    };
  } catch (error) {
    console.error('Error generating requisition:', error);
    if (isAxiosError(error)) {
      const errMessage = apiErrorHandler(error);
      return {
        success: false,
        error: errMessage,
        fileUrl: null,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate requisition',
      fileUrl: null,
    };
  }
}

export const deleteRequisition = async (requisitionId: string) => {
  const requisition = await getRequisition(requisitionId);
  if (!requisition) {
    return {
      error: true,
      message: 'Requisition not found',
    };
  }

  await db.transaction(async tx => {
    await tx.delete(mrqDetails).where(eq(mrqDetails.headerId, requisition.id));
    await tx.delete(mrqHeaders).where(eq(mrqHeaders.reference, requisitionId));
  });

  revalidateMaterialRequisitions(requisitionId);

  return {
    error: false,
    message: 'Requisition deleted successfully',
  };
};
