import type { z } from 'zod';

import type { getStores } from '@/features/store/services/stores/data';
import type {
  conversionSchema,
  grnFormSchema,
  materialIssueFormSchema,
  materialTransferFormSchema,
  stockMovementReportFilterSchema,
  stockMovementReportSchema,
  storeFormSchema,
} from '@/features/store/utils/schema';

export type StoreCacheTags =
  | 'stores'
  | 'grns'
  | 'grn number'
  | 'material issues'
  | 'material issue no'
  | 'unreceived orders'
  | 'transfers'
  | 'product-deactivation-batches';

export type Store = Awaited<ReturnType<typeof getStores>>[number];
export type StoreFormValues = z.infer<typeof storeFormSchema>;

export type GrnFormValues = z.infer<typeof grnFormSchema>;

export type MaterialTransferFormValues = z.infer<
  typeof materialTransferFormSchema
>;

export type MaterialIssueFormValues = z.infer<typeof materialIssueFormSchema>;

export type ConversionFormValues = z.infer<typeof conversionSchema>;

export type StockMovementType =
  | 'GRN'
  | 'ISSUE'
  | 'TRANSFER'
  | 'CONVERSION'
  | 'CONVERSION_IN'
  | 'CONVERSION_OUT'
  | 'TRANSFER_IN';

export type StockMovementReportFormValues = z.infer<
  typeof stockMovementReportSchema
>;

export type StockMovementReportFilterFormValues = z.infer<
  typeof stockMovementReportFilterSchema
>;

export interface StockMovementReportRow {
  itemId: string;
  productName: string;
  openingBalance: number;
  grn: number;
  issue: number;
  transferOut: number;
  transferIn: number;
  conversionOut: number;
  conversionIn: number;
  closingBalance: number;
}
