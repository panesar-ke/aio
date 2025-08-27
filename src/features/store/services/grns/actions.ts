'use server';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import type {
  GrnFormValues,
  StockMovementType,
} from '@/features/store/utils/store.types';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';
import { validateFields } from '@/lib/action-validator';
import { grnFormSchema } from '@/features/store/utils/schema';
import db from '@/drizzle/db';
import { revalidateGrnsTag } from '@/features/store/utils/cache';
import {
  grnsDetails,
  grnsHeader,
  ordersDetails,
  ordersHeader,
  stockMovements,
} from '@/drizzle/schema';
import { getCurrentUser } from '@/lib/session';
import { getGrnNumber } from '@/features/store/services/grns/data';
import { dateFormat } from '@/lib/helpers/formatters';

const validateGrn = async (values: unknown) => {
  const { data, error } = validateFields<GrnFormValues>(values, grnFormSchema);
  if (error !== null) {
    return {
      error: 'Invalid GRN data',
      data: null,
    } satisfies SchemaValidationFailure;
  }
  return {
    error: null,
    data,
  } satisfies SchemaValidationSuccess<GrnFormValues>;
};

export const createGrn = async (values: GrnFormValues) => {
  const { error, data } = await validateGrn(values);

  if (error !== null) {
    return { error: true, message: error };
  }

  if (data.items.length === 0) {
    return { error: true, message: 'At least one item is required' };
  }

  const grnNo = await getGrnNumber();

  try {
    const user = await getCurrentUser();

    if (!user) return { error: true, message: 'Unauthorized' };

    const order = await db.query.ordersHeader.findFirst({
      where: (order, { eq, and }) => {
        return and(
          eq(order.id, Number(data.orderId)),
          eq(order.isDeleted, false)
        );
      },
    });

    if (!order) return { error: true, message: 'Order not found' };
    const receiptDate = dateFormat(data.receiptDate);

    const reference = await db.transaction(async tx => {
      const [{ id }] = await tx
        .insert(grnsHeader)
        .values({
          id: grnNo,
          receiptDate,
          invoiceNo: data.invoiceNo,
          orderId: Number(data.orderId),
          vendorId: data.vendorId,
          createdBy: user.id,
          storeId: data.storeId,
        })
        .returning({ id: grnsHeader.id });

      const formattedDetails = data.items.map(i => ({
        headerId: id,
        itemId: i.itemId,
        qty: i.qty.toString(),
        rate: i.rate?.toString() ?? '0',
        remarks: i.remarks,
        orderedQty: i.orderedQty.toString(),
      }));

      await tx.insert(grnsDetails).values(formattedDetails);

      await tx
        .update(ordersHeader)
        .set({ grnReceipt: true })
        .where(eq(ordersHeader.id, Number(data.orderId)));

      await tx
        .update(ordersDetails)
        .set({ received: true })
        .where(
          inArray(
            ordersDetails.id,
            data.items.map(i => i.id)
          )
        );

      const grnItems = data.items.map(item => ({
        transactionDate: receiptDate,
        itemId: item.itemId,
        qty: item.orderedQty.toString(),
        transactionType: 'GRN' as StockMovementType,
        transactionId: id.toString(),
        createdBy: user.id,
        storeId: data.storeId,
      }));

      await tx.insert(stockMovements).values(grnItems);

      return id.toString();
    });

    revalidateGrnsTag(reference);
  } catch (error) {
    console.error(error);
    return { error: true, message: 'Failed to create GRN' };
  }
  return redirect('/store/grn');
};

export const deleteGrn = async (id: string) => {
  try {
    if (isNaN(Number(id))) return { error: true, message: 'Invalid GRN ID' };
    const grn = await db.query.grnsHeader.findFirst({
      columns: { orderId: true },
      where: (grn, { eq }) => eq(grn.id, Number(id)),
    });

    await db.transaction(async tx => {
      if (grn?.orderId) {
        await tx
          .update(ordersHeader)
          .set({ grnReceipt: false })
          .where(eq(ordersHeader.id, grn.orderId));
        await tx
          .update(ordersDetails)
          .set({ received: false })
          .where(eq(ordersDetails.headerId, grn.orderId));
      }

      await tx.delete(grnsDetails).where(eq(grnsDetails.headerId, Number(id)));
      await tx.delete(grnsHeader).where(eq(grnsHeader.id, Number(id)));
      await tx
        .delete(stockMovements)
        .where(
          and(
            eq(stockMovements.transactionId, id),
            eq(stockMovements.transactionType, 'GRN')
          )
        );
    });
    revalidateGrnsTag(id);

    return { error: false, message: 'Deleted successfully' };
  } catch (error) {
    console.error(error);
    return { error: true, message: 'Failed to delete GRN' };
  }
};
