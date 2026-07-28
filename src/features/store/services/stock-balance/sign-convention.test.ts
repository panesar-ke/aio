import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  MOVEMENT_IN,
  MOVEMENT_OUT,
  signedQtySum,
} from '@/features/store/services/stock-balance/sign-convention';

const dialect = new PgDialect();

describe('MOVEMENT_IN / MOVEMENT_OUT', () => {
  it('matches the established sign convention', () => {
    expect(MOVEMENT_IN).toEqual([
      'GRN',
      'TRANSFER_IN',
      'CONVERSION_IN',
      'OPENING_BAL',
    ]);
    expect(MOVEMENT_OUT).toEqual(['ISSUE', 'TRANSFER', 'CONVERSION_OUT']);
  });
});

describe('signedQtySum', () => {
  it('builds a signed CASE-sum over the shared inbound/outbound lists', () => {
    const query = dialect.sqlToQuery(
      sql`SELECT ${signedQtySum({
        transactionType: sql`transaction_type`,
        qty: sql`qty`,
      })} AS balance FROM stock_movements`,
    );

    expect(query.sql).toContain('CASE WHEN transaction_type IN ($1, $2, $3, $4)');
    expect(query.sql).toContain('THEN COALESCE(qty, 0)');
    expect(query.sql).toContain('transaction_type IN ($5, $6, $7)');
    expect(query.sql).toContain('THEN -COALESCE(qty, 0)');
    expect(query.params).toEqual([
      'GRN',
      'TRANSFER_IN',
      'CONVERSION_IN',
      'OPENING_BAL',
      'ISSUE',
      'TRANSFER',
      'CONVERSION_OUT',
    ]);
  });
});
