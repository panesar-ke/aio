import {
  deleteLoginAttemptsBefore,
  LOGIN_ATTEMPT_RETENTION_DAYS,
} from '@/features/auth/services/login-throttle';
import { inngest } from '@/inngest/client';

/**
 * Trims `login_attempts` to its retention window.
 *
 * The table takes a row per credential submission, so a spray against random
 * identifiers writes rows even though none of them ever match an account. The
 * per-IP Arcjet limit caps how fast that can happen; this caps how long it
 * accumulates.
 *
 * Scheduled natively rather than through a Vercel cron route, unlike the
 * event-triggered jobs beside it: there is no reason to expose an HTTP trigger
 * for this, and `/api/cron/*` is exempted from Arcjet in proxy.ts.
 */
export const pruneLoginAttempts = inngest.createFunction(
  {
    id: 'prune-login-attempts',
    retries: 2,
    triggers: [{ cron: 'TZ=Africa/Nairobi 15 2 * * *' }],
  },
  async ({ step }) => {
    const deletedCount = await step.run('delete-expired-attempts', async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - LOGIN_ATTEMPT_RETENTION_DAYS);

      const deleted = await deleteLoginAttemptsBefore(cutoff);

      console.info('Pruned expired login attempts', {
        cutoff: cutoff.toISOString(),
        deleted,
        retentionDays: LOGIN_ATTEMPT_RETENTION_DAYS,
      });

      return deleted;
    });

    return { deletedCount, retentionDays: LOGIN_ATTEMPT_RETENTION_DAYS };
  },
);
