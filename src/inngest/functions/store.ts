import {
  deactivateAndLogStaleProducts,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';

// Split into per-purpose steps so retries are meaningful:
// deactivateAndLogStaleProducts is a single DB transaction, so a retry that
// re-runs it from scratch is always safe. notifyStoreAdminsOfDeactivation
// wraps each admin notification in its own uniquely named step.run, so a
// retry only re-sends notifications that didn't already succeed — a single
// step.run around the whole admin loop would re-run it from scratch on
// retry, duplicating notifications already sent to earlier admins.
export const deactivateStaleProducts = inngest.createFunction(
  { id: 'deactivate-stale-products', retries: 2 },
  { cron: '0 6 * * 1' },
  async ({ event, step }) => {
    const batch = await step.run('deactivate-and-log-batch', async () => {
      return deactivateAndLogStaleProducts();
    });

    if (!batch) {
      return { batchId: null, totalCount: 0 };
    }

    await notifyStoreAdminsOfDeactivation(
      batch.batchId,
      batch.totalCount,
      event.id,
      step,
    );

    return batch;
  },
);
