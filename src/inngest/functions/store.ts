import {
  deactivateAndLogStaleProducts,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';

// Split into two steps (persist, then notify) so retries are meaningful:
// deactivateAndLogStaleProducts is a single DB transaction, so a retry that
// re-runs it from scratch is always safe. Once it's memoized, a retry only
// re-attempts the notification fan-out, instead of re-running the whole
// function — which would otherwise find zero remaining candidates (they're
// already deactivated) and silently no-op, masking a failed notification run
// as a success.
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

    await step.run('notify-store-admins', async () => {
      await notifyStoreAdminsOfDeactivation(
        batch.batchId,
        batch.totalCount,
        event.id,
      );
    });

    return batch;
  },
);
