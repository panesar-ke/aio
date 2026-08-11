import type { ProcurementCacheTag } from '@/features/procurement/utils/procurement.types';
import type { CNCCacheTag } from '@/features/production/cnc/utils/cnc.types';
import type { StoreCacheTags } from '@/features/store/utils/store.types';

import { type AdminCacheTag } from '@/features/admin/utils/admin.types';
import { type SalesCacheTag } from '@/features/sales/utils/sales.types';

type CacheTag =
  | ProcurementCacheTag
  | AdminCacheTag
  | StoreCacheTags
  | CNCCacheTag
  | SalesCacheTag;

export function getGlobalTag(tag: CacheTag) {
  return `global:${tag}` as const;
}

export function getIdTag(tag: CacheTag, id: string) {
  return `id:${id}-${tag}` as const;
}
