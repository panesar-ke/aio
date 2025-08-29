import type { z } from 'zod';
import type { getStores } from '@/features/store/services/stores/data';
import type {
  grnFormSchema,
  materialTransferFormSchema,
  storeFormSchema,
} from '@/features/store/utils/schema';

export type StoreCacheTags =
  | 'stores'
  | 'grns'
  | 'grn number'
  | 'material issues'
  | 'unreceived orders'
  | 'transfers';

export type Store = Awaited<ReturnType<typeof getStores>>[number];
export type StoreFormValues = z.infer<typeof storeFormSchema>;

export type GrnFormValues = z.infer<typeof grnFormSchema>;

export type MaterialTransferFormValues = z.infer<
  typeof materialTransferFormSchema
>;

export type StockMovementType =
  | 'GRN'
  | 'ISSUE'
  | 'TRANSFER'
  | 'CONVERSION'
  | 'CONVERSION_IN'
  | 'CONVERSION_OUT'
  | 'TRANSFER_IN';
