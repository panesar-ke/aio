import { getIdTag } from '@/lib/cache';

export function getFormsGlobalTag(userId: string) {
  return getIdTag('forms', userId);
}
