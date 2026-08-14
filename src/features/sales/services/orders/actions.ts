'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import db from '@/drizzle/db';
import { salesOrdersDetails, salesOrdersHeader } from '@/drizzle/schema';
import { calculateVatValues } from '@/features/procurement/utils/calculators';
import { getSaleOrderNo } from '@/features/sales/services/orders/data';
import {
  revalidateAccountsTag,
  revalidateSalesOrderTag,
} from '@/features/sales/utils/cache';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import { canEditDeleteSaleOrder } from '@/features/sales/utils/sale-order-permissions';
import {
  saleOrderFormSchema,
  type SaleOrderFormValues,
} from '@/features/sales/utils/schemas';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  toDecimalNumber,
  toDecimalString,
  toNumber,
} from '@/lib/helpers/numbers';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';

const buildSaleOrderHeaderPayload = (values: SaleOrderFormValues) => {
  const subTotal = values.details.reduce(
    (acc, item) => acc + toNumber(item.qty) * toDecimalNumber(item.rate),
    0,
  );
  const vatValues = calculateVatValues(
    values.vatType,
    subTotal,
    Number(values.vatRate) || 0,
  );

  return {
    dateRaised: values.orderDate,
    accountId: values.accountId,
    vatType: values.vatType,
    vatRate:
      values.vatType === 'NONE' ? '0' : values.vatRate?.toString() || '0',
    amountExclusive: toDecimalString(vatValues.exclusive),
    amountInclusive: toDecimalString(vatValues.inclusive),
    vatAmount: toDecimalString(vatValues.vatValue),
    currency: values.currency,
    conversionRate:
      values.currency === 'KES' ? '1' : values.exchangeRate?.toString(),
    totalAmountInLocalCurrency:
      values.currency === 'KES'
        ? toDecimalString(vatValues.inclusive)
        : toDecimalString(
            Number(vatValues.inclusive) * Number(values.exchangeRate || 1),
          ),
  };
};

const buildSaleOrderLinePayload = (
  d: SaleOrderFormValues['details'],
  headerId: number,
) => {
  return d.map((d) => ({
    headerId,
    item: d.item,
    category: d.category,
    amount: toDecimalString(toDecimalNumber(d.rate) * toNumber(d.qty)),
    rate: toDecimalString(toDecimalNumber(d.rate)),
    qty: toDecimalString(d.qty),
  }));
};

const revalidateSaleOrder = (
  saleOrderId: number,
  accountIds: Array<string | null>,
) => {
  revalidateSalesOrderTag(saleOrderId.toString());
  for (const accountId of new Set(accountIds.filter((id) => id !== null))) {
    revalidateAccountsTag(accountId);
  }
  revalidatePath('/sales/orders');
  revalidatePath('/sales/accounts');
  revalidatePath(`/sales/orders/${saleOrderId}/details`);
  revalidatePath(`/sales/orders/${saleOrderId}/edit`);
};

const createSaleOrder = async (values: SaleOrderFormValues) => {
  const user = await getCurrentUser();
  const saleOrderId = await db.transaction(async (tx) => {
    const saleOrderNo = await getSaleOrderNo(tx);
    const [{ id }] = await tx
      .insert(salesOrdersHeader)
      .values({
        id: saleOrderNo,
        ...buildSaleOrderHeaderPayload(values),
        saleOrderNo,
        salesRepId: user.id,
      })
      .returning({ id: salesOrdersHeader.id });

    const lines = buildSaleOrderLinePayload(values.details, id);

    await tx.insert(salesOrdersDetails).values(lines);

    return id;
  });

  revalidateSaleOrder(saleOrderId, [values.accountId]);

  return {
    error: false,
    message: 'Sale order created successfully!',
  };
};

const updateSaleOrder = async (
  saleOrderId: number,
  values: SaleOrderFormValues,
) => {
  const { isSalesAdmin } = await saleUser();

  const previousAccountId = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        status: salesOrdersHeader.status,
        accountId: salesOrdersHeader.accountId,
        salesRepId: salesOrdersHeader.salesRepId,
      })
      .from(salesOrdersHeader)
      .where(eq(salesOrdersHeader.id, saleOrderId))
      .limit(1);

    if (!existing) {
      throw new ActionError('Sale order not found.');
    }

    if (!isSalesAdmin) {
      throw new ActionError('You are not allowed to edit this sale order.');
    }

    if (!canEditDeleteSaleOrder(existing.status)) {
      throw new ActionError(
        'A cancelled sale order cannot be edited. Duplicate it to raise a new one.',
      );
    }

    await tx
      .update(salesOrdersHeader)
      .set(buildSaleOrderHeaderPayload(values))
      .where(
        and(
          eq(salesOrdersHeader.id, saleOrderId),
          ne(salesOrdersHeader.status, 'cancelled'),
        ),
      );

    await tx
      .delete(salesOrdersDetails)
      .where(eq(salesOrdersDetails.headerId, saleOrderId));

    await tx
      .insert(salesOrdersDetails)
      .values(buildSaleOrderLinePayload(values.details, saleOrderId));

    return existing.accountId;
  });

  revalidateSaleOrder(saleOrderId, [previousAccountId, values.accountId]);

  return {
    error: false,
    message: 'Sale order updated successfully!',
  };
};

export const upsertSaleOrder = async (values: unknown) =>
  runAction('upsert-sale-order', async () => {
    await requireAnyPermission(['sales:admin', 'sales:standard']);
    const data = parseOrFail(saleOrderFormSchema, values);

    if (!data.id) {
      return await createSaleOrder(data);
    }

    const saleOrderId = Number(data.id);

    if (!Number.isInteger(saleOrderId) || saleOrderId < 1) {
      throw new ActionError('Invalid sale order reference.');
    }

    return await updateSaleOrder(saleOrderId, data);
  });

export const cancelSaleOrder = async (saleOrderId: number) =>
  runAction('cancel-sale-order', async () => {
    await requirePermission('sales:admin');

    if (!Number.isInteger(saleOrderId) || saleOrderId < 1) {
      throw new ActionError('Invalid sale order reference.');
    }

    const user = await getCurrentUser();

    const accountId = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          status: salesOrdersHeader.status,
          accountId: salesOrdersHeader.accountId,
        })
        .from(salesOrdersHeader)
        .where(eq(salesOrdersHeader.id, saleOrderId))
        .limit(1);

      if (!existing) {
        throw new ActionError('Sale order not found.');
      }

      if (!canEditDeleteSaleOrder(existing.status)) {
        throw new ActionError('This sale order has already been cancelled.');
      }

      await tx
        .update(salesOrdersHeader)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: user.id,
        })
        .where(
          and(
            eq(salesOrdersHeader.id, saleOrderId),
            ne(salesOrdersHeader.status, 'cancelled'),
          ),
        );

      return existing.accountId;
    });

    revalidateSaleOrder(saleOrderId, [accountId]);

    return {
      error: false,
      message: 'Sale order cancelled successfully!',
    };
  });
