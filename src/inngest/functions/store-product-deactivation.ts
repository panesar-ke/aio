import {
  deactivateAndLogStaleProducts,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';

export const runStoreProductDeactivation = inngest.createFunction(
  { id: 'run-store-product-deactivation', retries: 2 },
  { event: 'store/run.product-deactivation' },
  async ({ event, step }) => {
    const { requestId, source, triggeredAt } = event.data;

    console.info('Starting store product deactivation job', {
      eventId: event.id,
      requestId,
      source,
      triggeredAt,
    });

    const batch = await step.run('deactivate-and-log-stale-products', async () => {
      const result = await deactivateAndLogStaleProducts(undefined, requestId);

      console.info('Finished deactivation batch step', {
        eventId: event.id,
        requestId,
        batchId: result?.batchId ?? null,
        totalCount: result?.totalCount ?? 0,
      });

      return result;
    });

    if (!batch) {
      console.info('No stale products found for deactivation', {
        eventId: event.id,
        requestId,
      });

      return {
        batchId: null,
        totalCount: 0,
        notifiedCount: 0,
        requestId,
      };
    }

    const notificationResult = await step.run(
      'notify-store-admins-of-deactivation',
      async () => {
        const result = await notifyStoreAdminsOfDeactivation(
          batch.batchId,
          batch.totalCount,
        );

        console.info('Finished store admin notification step', {
          eventId: event.id,
          requestId,
          batchId: batch.batchId,
          totalCount: batch.totalCount,
          notifiedCount: result.notifiedCount,
        });

        return result;
      },
    );

    return {
      batchId: batch.batchId,
      totalCount: batch.totalCount,
      notifiedCount: notificationResult.notifiedCount,
      requestId,
    };
  },
);
