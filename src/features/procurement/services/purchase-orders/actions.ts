"use server";
import type { AxiosResponse } from "axios";
import type { SQL } from "drizzle-orm";

import { createId } from "@paralleldrive/cuid2";
import { isAxiosError } from "axios";
import { eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import type { OrderData } from "@/features/procurement/utils/procurement.types";
import type {
  ApiFailure,
  ApiFailureWithoutData,
  ApiSuccess,
  ApiSuccessWithoutData,
} from "@/types/index.types";

import db from "@/drizzle/db";
import { mrqDetails, ordersDetails, ordersHeader } from "@/drizzle/schema";
import {
  getMaterialRequisitionGlobalTag,
  getPendingRequestsGlobalTag,
  getVendorStatsGlobalTag,
  revalidateMaterialRequisitions,
  revalidatePurchaseOrders,
} from "@/features/procurement/utils/cache";
import {
  calculateDiscount,
  calculateVatValues,
} from "@/features/procurement/utils/calculators";
import { orderSchema } from "@/features/procurement/utils/schemas";
import { inngest } from "@/inngest/client";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import axios from "@/lib/axios";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { getCurrentUser } from "@/lib/session";
import { apiErrorHandler } from "@/lib/utils";

import { getPurchaseOrder } from "./data";

type PurchaseOrderNoAllocatorTx = {
  execute: (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

export const allocatePurchaseOrderNo = async (
  tx: PurchaseOrderNoAllocatorTx,
) => {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('orders_header_id_allocation'))`,
  );

  const result = await tx.execute(
    sql`select coalesce(max(${ordersHeader.id}), 0) + 1 as "orderNo" from ${ordersHeader}`,
  );
  const rawOrderNo = result.rows[0]?.orderNo;
  const orderNo =
    typeof rawOrderNo === "number" ? rawOrderNo : Number(rawOrderNo);

  if (!Number.isFinite(orderNo) || orderNo < 1) {
    throw new Error("Unable to allocate purchase order number");
  }

  return orderNo;
};

export const createOrder = async ({
  values,
  id,
}: {
  values: unknown;
  id?: string;
}) =>
  runAction("create-order", async () => {
    await requireAnyPermission(["procurement:admin", "procurement:standard"]);
    const data = parseOrFail(orderSchema, values);

    const user = await getCurrentUser();

    const existingOrder = id ? await getPurchaseOrder(id) : null;
    if (id && !existingOrder) {
      return { error: true, message: "Order not found", data: null };
    }
    const existingOrderNo = existingOrder?.id ?? null;

    const {
      details,
      documentDate,
      vendor,
      invoiceDate,
      invoiceNo,
      vat,
      vatType,
    } = data;

    const vatId = vatType !== "NONE" && vat ? (vat === "16" ? 1 : 2) : null;
    const requestIds = details.map((detail) => Number(detail.requestId));

    const reference = await db.transaction(async (tx) => {
      const orderNo = existingOrderNo ?? (await allocatePurchaseOrderNo(tx));
      const headerValues = {
        id: orderNo,
        reference: createId(),
        documentDate,
        vendorId: vendor,
        billDate: invoiceDate ? new Date(invoiceDate).toISOString() : null,
        billNo: invoiceNo,
        vatType,
        vatId,
        createdBy: user.id,
      };

      const ref = id
        ? await tx
            .insert(ordersHeader)
            .values(headerValues)
            .onConflictDoUpdate({
              target: ordersHeader.id,
              set: {
                documentDate,
                vendorId: vendor,
                billDate: invoiceDate
                  ? new Date(invoiceDate).toISOString()
                  : null,
                billNo: invoiceNo,
                vatType,
                fileUrl: null,
                vatId,
              },
            })
            .returning({ reference: ordersHeader.reference })
        : await tx
            .insert(ordersHeader)
            .values(headerValues)
            .returning({ reference: ordersHeader.reference });

      if (id) {
        const previousDetails = await tx
          .select({ requestId: ordersDetails.requestId })
          .from(ordersDetails)
          .where(eq(ordersDetails.headerId, orderNo));
        const previousRequestIds = previousDetails
          .map((detail) => detail.requestId)
          .filter((requestId): requestId is number => requestId !== null);

        if (previousRequestIds.length > 0) {
          await tx
            .update(mrqDetails)
            .set({ linked: false })
            .where(inArray(mrqDetails.requestId, previousRequestIds));
        }
        await tx
          .delete(ordersDetails)
          .where(eq(ordersDetails.headerId, orderNo));
      }

      if (requestIds.length > 0) {
        await tx
          .update(mrqDetails)
          .set({ linked: true })
          .where(inArray(mrqDetails.requestId, requestIds));
      }

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
          const gross = Number(qty) * parseFloat(rate?.toString() || "0");
          const discountedAmount = calculateDiscount(
            discountType ?? "NONE",
            discount ?? 0,
            gross,
          );
          const subTotal = gross - discountedAmount;
          const vatValues = calculateVatValues(vatType, subTotal, vat ?? 0);
          return {
            headerId: orderNo,
            requestId: Number(requestId),
            projectId,
            itemId: type === "item" ? itemOrServiceId : null,
            serviceId: type === "service" ? itemOrServiceId : null,
            qty: qty.toString(),
            rate: rate?.toString() || "0",
            discountType: discountType ?? "NONE",
            discount: discount ? discount.toString() : "0",
            discountedAmount: discountedAmount.toString(),
            amountExclusive: vatValues.exclusive.toString(),
            vat: vatValues.vatValue.toString(),
            amountInclusive: vatValues.inclusive.toString(),
          };
        },
      );

      await tx.insert(ordersDetails).values(formattedDetails);

      return ref[0].reference;
    });

    revalidatePurchaseOrders(reference);
    revalidateMaterialRequisitions();
    revalidateTag(getVendorStatsGlobalTag(), "max");

    return {
      error: false,
      message: id ? "Order updated successfully" : "Order created successfully",
      data: reference,
    };
  });

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
    message: "Order URL updated successfully",
  };
}

export const generateOrderFile = async (
  data: OrderData,
  orderId: string,
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
      message: "Order file generated successfully",
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
      message: "An unexpected error occurred while generating the order file.",
      data: null,
    } satisfies ApiFailure;
  }
};

export const sendOrderEmailAction = async (
  email: string,
  orderNo: string | number,
  fileUrl: string,
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> => {
  try {
    await axios.post("/send-order-mail", {
      supplierEmail: email,
      orderNumber: orderNo,
      s3Url: fileUrl,
    });

    return {
      error: false,
      message: "Email sent successfully",
    } satisfies ApiSuccessWithoutData;
  } catch (error) {
    console.error("Error sending order email:", error);
    return {
      error: true,
      message: "Failed to send order email",
    } satisfies ApiFailureWithoutData;
  }
};

export const deleteOrder = async (orderId: string) => {
  await requireAnyPermission(["procurement:admin"]);
  const order = await getPurchaseOrder(orderId);

  if (!order) return { error: true, message: "Order not found", data: null };

  const requestIds = order.ordersDetails.map(({ requestId }) => requestId ?? 0);

  try {
    await db.transaction(async (tx) => {
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
    revalidateTag(getVendorStatsGlobalTag(), "max");

    return { error: false, message: "Order deleted successfully" };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      error: true,
      message:
        error instanceof Error ? error.message : "Failed to delete order",
    };
  }
};

export const sendOrderEmail = async (orderId: string) => {
  const user = await getCurrentUser();
  await inngest.send({
    name: "procurement/supplier.po.email",
    data: { orderId, userId: user.id },
  });
};

export const deletePendingRequests = async (requestIds: Array<string>) => {
  if (requestIds.length === 0) {
    return {
      error: false,
      message: "No pending requests to delete",
    };
  }

  try {
    const formattedRequisitionIds = requestIds.map((r) => Number(r));

    await db
      .delete(mrqDetails)
      .where(inArray(mrqDetails.requestId, formattedRequisitionIds));

    revalidateTag(getMaterialRequisitionGlobalTag(), "max");
    revalidateTag(getPendingRequestsGlobalTag(), "max");

    return {
      error: false,
      message: "Pending requests deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting pending requests:", error);
    return {
      error: true,
      message: "Failed to delete pending requests",
    };
  }
};
