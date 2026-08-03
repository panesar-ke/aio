import { inArray } from 'drizzle-orm';

import type { ProductUsageAggregate } from '@/features/store/services/product-deactivation/eligibility';

import db from '@/drizzle/db';
import {
  productDeactivationBatches,
  productDeactivationItems,
  products,
} from '@/drizzle/schema';
import { createNotification } from '@/features/global/services/actions';
import { getStoreAdminUserIds } from '@/features/store/services/product-deactivation/admins';
import { sumProductBalanceAcrossStores } from '@/features/store/services/product-deactivation/balance';
import { PRODUCT_DEACTIVATION_THRESHOLD_DAYS } from '@/features/store/services/product-deactivation/constants';
import { getEligibleCandidates } from '@/features/store/services/product-deactivation/eligibility';
import { revalidateProductDeactivation } from '@/features/store/utils/cache';
import { dateFormat } from '@/lib/helpers/formatters';

export function buildDeactivationItemRow(
  candidate: ProductUsageAggregate,
  balance: number,
) {
  return {
    productId: candidate.productId,
    lastUsedDate: candidate.lastUsedDate
      ? dateFormat(candidate.lastUsedDate)
      : null,
    lastUsedSource: candidate.lastUsedSource,
    balanceAtDeactivation: balance.toString(),
  };
}

export function buildProductDeactivationNotificationEventId(
  batchId: string,
  userId: string,
) {
  return `product-deactivation:${batchId}:${userId}`;
}

export async function deactivateAndLogStaleProducts(
  asOf: Date = new Date(),
): Promise<{ batchId: string; totalCount: number } | null> {
  const candidates = await getEligibleCandidates(
    PRODUCT_DEACTIVATION_THRESHOLD_DAYS,
    asOf,
  );

  if (candidates.length === 0) {
    return null;
  }

  const batchId = await db.transaction(async tx => {
    const [{ id }] = await tx
      .insert(productDeactivationBatches)
      .values({
        thresholdDays: PRODUCT_DEACTIVATION_THRESHOLD_DAYS,
        totalCount: candidates.length,
      })
      .returning({ id: productDeactivationBatches.id });

    await tx
      .update(products)
      .set({ active: false })
      .where(
        inArray(
          products.id,
          candidates.map(candidate => candidate.productId),
        ),
      );

    for (const candidate of candidates) {
      const balance = await sumProductBalanceAcrossStores(
        candidate.productId,
        asOf,
      );

      await tx.insert(productDeactivationItems).values({
        batchId: id,
        ...buildDeactivationItemRow(candidate, balance),
      });
    }

    return id;
  });

  revalidateProductDeactivation(batchId);

  return { batchId, totalCount: candidates.length };
}

export async function notifyStoreAdminsOfDeactivation(
  batchId: string,
  totalCount: number,
): Promise<{ notifiedCount: number }> {
  const adminUserIds = await getStoreAdminUserIds();
  let notifiedCount = 0;

  for (const adminUserId of adminUserIds) {
    await createNotification({
      title: 'Products auto-deactivated',
      message: `${totalCount} unused stock product${
        totalCount === 1 ? '' : 's'
      } were automatically deactivated for review.`,
      path: `/store/deactivated-items/${batchId}`,
      userId: adminUserId,
      notificationType: 'PRODUCT_DEACTIVATION',
      eventId: buildProductDeactivationNotificationEventId(
        batchId,
        adminUserId,
      ),
    });
    notifiedCount += 1;
  }

  return { notifiedCount };
}
