'use cache';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import db from '@/drizzle/db';
import { getJobTrackingGlobalTag } from '@/features/production/cnc/utils/cache';
import { and, ilike, ne, or } from 'drizzle-orm';
import { cncJobTracker } from '@/drizzle/schema';

export const getJobTrackerEntries = async (q?: string) => {
  cacheTag(getJobTrackingGlobalTag());

  return await db.query.cncJobTracker.findMany({
    columns: { createdAt: false, updatedAt: false, createdBy: false },
    where: and(
      ne(cncJobTracker.status, 'completed'),
      q
        ? or(
            ilike(cncJobTracker.jobCardNo, `%${q}%`),
            ilike(cncJobTracker.jobDescription, `%${q}%`),
            ilike(cncJobTracker.jobType, `%${q}%`)
          )
        : undefined
    ),
    orderBy: (model, { desc }) => [desc(model.createdAt)],
  });
};
