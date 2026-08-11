import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/cache';

export function getLeadsGlobalTag() {
  return getGlobalTag('leads');
}
export function getLeadIdTag(id: string) {
  return getIdTag('leads', id);
}

export function revalidateLeadsTag(id: string) {
  revalidateTag(getLeadsGlobalTag(), 'max');
  revalidateTag(getLeadIdTag(id), 'max');
}
