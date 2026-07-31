import { runProductDeactivation } from '@/features/store/services/product-deactivation/actions';
import { inngest } from '@/inngest/client';

export const deactivateStaleProducts = inngest.createFunction(
  { id: 'deactivate-stale-products', retries: 0 },
  { cron: '0 6 * * 1' },
  async ({ event, step }) => {
    const result = await step.run('run-product-deactivation', async () => {
      return runProductDeactivation(event.id);
    });

    return result ?? { batchId: null, totalCount: 0 };
  },
);
