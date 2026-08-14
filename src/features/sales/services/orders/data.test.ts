import { describe, expect, it, vi } from 'vitest';

vi.mock('@/drizzle/db', () => ({
  default: {},
}));
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));
vi.mock('@/features/sales/utils/sale-helpers', () => ({
  saleUser: vi.fn(),
}));

import { getSaleOrderNo } from '@/features/sales/services/orders/data';

const getQueryText = (query: { queryChunks: Array<unknown> }) =>
  query.queryChunks
    .map((chunk) =>
      typeof chunk === 'object' &&
      chunk !== null &&
      'value' in chunk &&
      Array.isArray(chunk.value)
        ? chunk.value.join('')
        : '',
    )
    .join('');

describe('getSaleOrderNo', () => {
  it('locks sale order number allocation before selecting the next number', async () => {
    const calls: Array<string> = [];
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        const queryText = getQueryText(query);
        calls.push(queryText);

        if (queryText.includes('max')) {
          return { rows: [{ saleOrderNo: 42 }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).resolves.toBe(42);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('pg_advisory_xact_lock');
    expect(calls[1]).toContain('max');
  });

  it('coerces the allocated sale order number when the database returns a string', async () => {
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        if (getQueryText(query).includes('max')) {
          return { rows: [{ saleOrderNo: '42' }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).resolves.toBe(42);
  });

  it('throws when the allocated sale order number is not usable', async () => {
    const tx = {
      execute: vi.fn(async (query: { queryChunks: Array<unknown> }) => {
        if (getQueryText(query).includes('max')) {
          return { rows: [{ saleOrderNo: null }] };
        }

        return { rows: [] };
      }),
    };

    await expect(getSaleOrderNo(tx)).rejects.toThrow(
      'Unable to allocate sale order number',
    );
  });
});
