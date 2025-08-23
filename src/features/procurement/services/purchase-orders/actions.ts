'use server';
import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { createId } from '@paralleldrive/cuid2';
import { eq, inArray } from 'drizzle-orm';
import { isAxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  ApiFailure,
  ApiFailureWithoutData,
  ApiSuccess,
  ApiSuccessWithoutData,
} from '@/types/index.types';
import type {
  OrderData,
  OrderFormValues,
} from '@/features/procurement/utils/procurement.types';
import { getPurchaseOrder, getPurchaseOrderNo } from './data';
import { orderSchema } from '@/features/procurement/utils/schemas';
import db from '@/drizzle/db';
import { mrqDetails, ordersDetails, ordersHeader } from '@/drizzle/schema';
import { getCurrentUser } from '@/lib/session';
import {
  calculateDiscount,
  calculateVatValues,
} from '@/features/procurement/utils/calculators';
import {
  getMaterialRequisitionGlobalTag,
  getPendingRequestsGlobalTag,
  getVendorStatsGlobalTag,
  revalidateMaterialRequisitions,
  revalidatePurchaseOrders,
} from '@/features/procurement/utils/cache';
import axios from '@/lib/axios';
import { apiErrorHandler } from '@/lib/utils';
import { inngest } from '@/inngest/client';

export const createOrder = async ({
  values,
  submitType,
  id,
}: {
  values: OrderFormValues;
  submitType: 'SUBMIT' | 'SUBMIT_SEND';
  id?: string;
}) => {
  const { success, data, error } = orderSchema.safeParse(values);
  if (!success) {
    console.log(error);
    return {
      error: true,
      message: 'Validation failed. Check all required fields and try again.',
    };
  }

  const user = await getCurrentUser();

  const orderNo = id
    ? (await getPurchaseOrder(id))?.id
    : await getPurchaseOrderNo();
  if (!orderNo)
    return {
      error: true,
      message: 'Unable to generate order number',
    };

  const {
    details,
    documentDate,
    vendor,
    invoiceDate,
    invoiceNo,
    vat,
    vatType,
  } = data;

  const reference = await db.transaction(async tx => {
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
        createdBy: user.id,
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
      .returning({ reference: ordersHeader.reference });

    if (id) {
      await tx.delete(ordersDetails).where(eq(ordersDetails.headerId, orderNo));
      details.forEach(async detail => {
        await tx
          .update(mrqDetails)
          .set({ linked: false })
          .where(eq(mrqDetails.requestId, +detail.requestId));
      });
    }

    details.forEach(async detail => {
      await tx
        .update(mrqDetails)
        .set({ linked: true })
        .where(eq(mrqDetails.requestId, +detail.requestId));
    });

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
        const gross = Number(qty) * parseFloat(rate?.toString() || '0');
        const discountedAmount = calculateDiscount(
          discountType ?? 'NONE',
          discount ?? 0,
          gross
        );
        const subTotal = gross - discountedAmount;
        const vatValues = calculateVatValues(vatType, subTotal, vat ?? 0);
        return {
          headerId: orderNo,
          requestId: Number(requestId),
          projectId,
          itemId: type === 'item' ? itemOrServiceId : null,
          serviceId: type === 'service' ? itemOrServiceId : null,
          qty: qty.toString(),
          rate: rate?.toString() || '0',
          discountType: discountType ?? 'NONE',
          discount: discount ? discount.toString() : '0',
          discountedAmount: discountedAmount.toString(),
          amountExclusive: vatValues.exclusive.toString(),
          vat: vatValues.vatValue.toString(),
          amountInclusive: vatValues.inclusive.toString(),
        };
      }
    );

    await tx.insert(ordersDetails).values(formattedDetails);

    return ref[0].reference;
  });

  if (submitType === 'SUBMIT_SEND') {
    await inngest.send({
      name: 'procurement/supplier.po.email',
      data: { orderId: reference, userId: user.id },
    });
  }
  revalidatePurchaseOrders(reference);
  revalidateMaterialRequisitions();
  revalidateTag(getVendorStatsGlobalTag());

  redirect(`/procurement/purchase-order/${reference}/details`);
};

export async function updateOrderUrl({
  fileUrl,
  orderId,
}: {
  fileUrl: string;
  orderId: string;
}) {
  await db
    .update(ordersHeader)
    .set({ fileUrl })
    .where(eq(ordersHeader.reference, orderId));

  revalidatePurchaseOrders(orderId);

  return {
    error: false,
    message: 'Order URL updated successfully',
  };
}

export const generateOrderFile = async (
  data: OrderData,
  orderId: string
): Promise<ApiSuccess | ApiFailure> => {
  try {
    const res: AxiosResponse<{
      success: boolean;
      message: string;
      url: string;
    }> = await axios.post(`/generate-purchase-order`, data);

    if (!res.data.success) {
      return {
        error: true,
        message: res.data.message,
        data: null,
      } satisfies ApiFailure;
    }

    await db
      .update(ordersHeader)
      .set({ fileUrl: res.data.url })
      .where(eq(ordersHeader.reference, orderId));

    revalidatePurchaseOrders(orderId);

    return {
      error: false,
      data: res.data.url,
      message: 'Order file generated successfully',
    } satisfies ApiSuccess;
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: true,
        message: apiErrorHandler(error),
        data: null,
      } satisfies ApiFailure;
    }
    if (error instanceof Error) {
      return {
        error: true,
        message: error.message,
        data: null,
      } satisfies ApiFailure;
    }
    return {
      error: true,
      message: 'An unexpected error occurred while generating the order file.',
      data: null,
    } satisfies ApiFailure;
  }
};

export const sendOrderEmailAction = async (
  email: string,
  orderNo: string | number,
  fileUrl: string
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> => {
  try {
    await axios.post('/send-order-mail', {
      supplierEmail: email,
      orderNumber: orderNo,
      s3Url: fileUrl,
    });

    return {
      error: false,
      message: 'Email sent successfully',
    } satisfies ApiSuccessWithoutData;
  } catch (error) {
    console.error('Error sending order email:', error);
    return {
      error: true,
      message: 'Failed to send order email',
    } satisfies ApiFailureWithoutData;
  }
};

export const deleteOrder = async (orderId: string) => {
  const order = await getPurchaseOrder(orderId);

  const requestIds = order.ordersDetails.map(({ requestId }) => requestId ?? 0);

  try {
    await db.transaction(async tx => {
      await tx
        .delete(ordersDetails)
        .where(eq(ordersDetails.headerId, order.id));
      await tx.delete(ordersHeader).where(eq(ordersHeader.reference, orderId));
      if (requestIds.length > 0) {
        await tx
          .update(mrqDetails)
          .set({ linked: false })
          .where(inArray(mrqDetails.requestId, requestIds));
      }
    });

    revalidatePurchaseOrders(orderId);
    revalidateMaterialRequisitions();
    revalidateTag(getVendorStatsGlobalTag());

    return { error: false, message: 'Order deleted successfully' };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      error: true,
      message:
        error instanceof Error ? error.message : 'Failed to delete order',
    };
  }
};

export const sendOrderEmail = async (orderId: string) => {
  const user = await getCurrentUser();
  await inngest.send({
    name: 'procurement/supplier.po.email',
    data: { orderId, userId: user.id },
  });
};

export const deletePendingRequests = async (requestIds: Array<string>) => {
  if (requestIds.length === 0) {
    return {
      error: false,
      message: 'No pending requests to delete',
    };
  }

  try {
    const formattedRequisitionIds = requestIds.map(r => Number(r));

    await db
      .delete(mrqDetails)
      .where(inArray(mrqDetails.requestId, formattedRequisitionIds));

    revalidateTag(getMaterialRequisitionGlobalTag());
    revalidateTag(getPendingRequestsGlobalTag());

    return {
      error: false,
      message: 'Pending requests successfully',
    };
  } catch (error) {
    console.error('Error deleting pending requests:', error);
    return {
      error: true,
      message: 'Failed to delete pending requests',
    };
  }
};
