import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';

import { sqlInList } from '@/features/store/services/stock-balance/utils';

export const MOVEMENT_IN = [
  'GRN',
  'TRANSFER_IN',
  'CONVERSION_IN',
  'OPENING_BAL',
] as const;

export const MOVEMENT_OUT = ['ISSUE', 'TRANSFER', 'CONVERSION_OUT'] as const;

interface QtySumColumns {
  transactionType: SQLWrapper;
  qty: SQLWrapper;
}

export const signedQtySum = ({
  transactionType,
  qty,
}: QtySumColumns): SQL<number> => sql<number>`COALESCE(SUM(CASE WHEN ${transactionType} IN ${sqlInList(MOVEMENT_IN)} THEN COALESCE(${qty}, 0) WHEN ${transactionType} IN ${sqlInList(MOVEMENT_OUT)} THEN -COALESCE(${qty}, 0) ELSE 0 END), 0)`;
