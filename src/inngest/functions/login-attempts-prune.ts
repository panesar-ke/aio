import {
  deleteLoginAttemptsChunk,
  LOGIN_ATTEMPT_PRUNE_CHUNK,
  LOGIN_ATTEMPT_RETENTION_DAYS,
} from '@/features/auth/services/login-throttle';
import { inngest } from '@/inngest/client';

/**
 * Ceiling on chunks removed in one run, so a run cannot grind on unbounded.
 * At the current chunk size this clears a million rows a night, well past what
 * a retention window can accumulate; a backlog larger than that drains over
 * consecutive nights instead of stalling one run.
 */
const MAX_PRUNE_CHUNKS = 200;

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
    // Its own step so a resumed run keeps the cutoff it started with rather
    // than recomputing a later one from the replayed function body.
    const cutoff = new Date(
      await step.run('resolve-cutoff', () => {
        const resolved = new Date();
        resolved.setDate(resolved.getDate() - LOGIN_ATTEMPT_RETENTION_DAYS);

        return resolved.toISOString();
      }),
    );

    let deletedCount = 0;
    let exhausted = false;

    // One step per chunk, not one step around the loop. Chunking bounds how
    // long a single DELETE holds its lock, but it does nothing about wall
    // time: a first prune facing millions of expired rows runs the whole loop
    // past the client's `maxRuntime`, burns both retries and fails the run.
    // Per-chunk steps give each DELETE its own budget and checkpoint the
    // progress already made.
    for (let chunk = 0; chunk < MAX_PRUNE_CHUNKS; chunk++) {
      const deleted = await step.run(`delete-expired-attempts-${chunk}`, () =>
        deleteLoginAttemptsChunk(cutoff),
      );

      deletedCount += deleted;

      // A chunk that comes back unfilled means nothing is left before the
      // cutoff.
      if (deleted < LOGIN_ATTEMPT_PRUNE_CHUNK) {
        exhausted = true;
        break;
      }
    }

    await step.run('report-pruned', () => {
      console.info('Pruned expired login attempts', {
        cutoff: cutoff.toISOString(),
        deleted: deletedCount,
        exhausted,
        retentionDays: LOGIN_ATTEMPT_RETENTION_DAYS,
      });

      return null;
    });

    return {
      deletedCount,
      exhausted,
      retentionDays: LOGIN_ATTEMPT_RETENTION_DAYS,
    };
  },
);
