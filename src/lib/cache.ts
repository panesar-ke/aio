import type { ProcurementCacheTag } from '@/features/procurement/utils/procurement.types';

type CacheTag = ProcurementCacheTag;

export function getGlobalTag(tag: CacheTag) {
  return `global:${tag}` as const;
}

export function getIdTag(tag: CacheTag, id: string) {
  return `id:${id}-${tag}` as const;
}
