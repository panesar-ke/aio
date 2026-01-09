'use cache';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import db from '@/drizzle/db';
import { getJobTrackingGlobalTag } from '@/features/production/cnc/utils/cache';

export const getJobTrackerEntries = async () => {
  cacheTag(getJobTrackingGlobalTag());

  return await db.query.cncJobTracker.findMany({
    columns: { createdAt: false, updatedAt: false, createdBy: false },
    orderBy: (model, { desc }) => [desc(model.createdAt)],
  });
};
