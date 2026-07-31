import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/cache';

export const getJobTrackingGlobalTag = () => {
  return getGlobalTag('job-tracking');
};

export const getJobTrackingIdTag = (id: string) => {
  return getIdTag('job-tracking', id);
};

export const revalidateJobTrackingTag = (id: string) => {
  revalidateTag(getJobTrackingGlobalTag(), 'max');
  revalidateTag(getJobTrackingIdTag(id), 'max');
};
