import { getGlobalTag, getIdTag } from '@/lib/cache';
import { revalidateTag } from 'next/cache';

export const getJobTrackingGlobalTag = () => {
  return getGlobalTag('job-tracking');
};

export const getJobTrackingIdTag = (id: string) => {
  return getIdTag('job-tracking', id);
};

export const revalidateJobTrackingTag = (id: string) => {
  revalidateTag(getJobTrackingGlobalTag());
  revalidateTag(getJobTrackingIdTag(id));
};
