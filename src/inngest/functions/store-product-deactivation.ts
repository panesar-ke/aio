import {
  deactivateNextStaleProductsChunk,
  notifyStoreAdminsOfDeactivation,
} from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';
import { storeProductDeactivationEvent } from '@/inngest/events';

const PRODUCT_DEACTIVATION_CHUNK_SIZE = 25;
const MAX_PRODUCT_DEACTIVATION_CHUNKS = 400;

export const runStoreProductDeactivation = inngest.createFunction(
  {
    id: 'run-store-product-deactivation',
    retries: 2,
    triggers: [storeProductDeactivationEvent],
  },
  async ({ event, step }) => {
    const { requestId, source, triggeredAt } = event.data;

    console.info('Starting store product deactivation job', {
      eventId: event.id,
      requestId,
      source,
      triggeredAt,
    });

    await step.run('start-store-product-deactivation-job', async () => {
      const startedAt = new Date().toISOString();

      console.info('Checkpointed store product deactivation start', {
        eventId: event.id,
        requestId,
        source,
        triggeredAt,
        startedAt,
      });

      return {
        requestId,
        source,
        triggeredAt,
        startedAt,
      };
    });

    let batchId: string | null = null;
    let totalCount = 0;

    for (
      let chunkIndex = 0;
      chunkIndex < MAX_PRODUCT_DEACTIVATION_CHUNKS;
      chunkIndex += 1
    ) {
      const chunk = await step.run(
        `deactivate-stale-products-chunk-${chunkIndex + 1}`,
        async () => {
          const result = await deactivateNextStaleProductsChunk(
            PRODUCT_DEACTIVATION_CHUNK_SIZE,
            undefined,
            requestId,
          );

          console.info('Finished deactivation chunk step', {
            eventId: event.id,
            requestId,
            chunkNumber: chunkIndex + 1,
            batchId: result?.batchId ?? null,
            processedCount: result?.processedCount ?? 0,
            totalCount: result?.totalCount ?? 0,
          });

          return result;
        },
      );

      if (!chunk || chunk.processedCount === 0) {
        break;
      }

      batchId = chunk.batchId;
      totalCount = chunk.totalCount;

      if (chunk.processedCount < PRODUCT_DEACTIVATION_CHUNK_SIZE) {
        break;
      }

      if (chunkIndex === MAX_PRODUCT_DEACTIVATION_CHUNKS - 1) {
        throw new Error(
          'Store product deactivation exceeded the maximum chunk count for a single run.',
        );
      }
    }

    if (!batchId || totalCount === 0) {
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
          batchId,
          totalCount,
        );

        console.info('Finished store admin notification step', {
          eventId: event.id,
          requestId,
          batchId,
          totalCount,
          notifiedCount: result.notifiedCount,
        });

        return result;
      },
    );

    return {
      batchId,
      totalCount,
      notifiedCount: notificationResult.notifiedCount,
      requestId,
    };
  },
);
