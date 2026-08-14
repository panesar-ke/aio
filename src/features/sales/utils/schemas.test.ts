import { describe, expect, it } from 'vitest';

import { saleOrderFormSchema } from '@/features/sales/utils/schemas';

const baseOrder = {
  id: null,
  orderDate: '2026-08-13',
  accountId: 'ecd4a2b0-0f6e-4c5f-9f1a-7f4c1d2b3a44',
  vatType: 'NONE' as const,
  details: [
    {
      id: 'line-1',
      item: 'Portland Cement',
      qty: 40,
      rate: 850,
      category: 'joinery',
    },
  ],
};

const exchangeRateIssues = (values: Record<string, unknown>) => {
  const result = saleOrderFormSchema.safeParse(values);
  return (
    result.error?.issues
      .filter((issue) => issue.path.join('.') === 'exchangeRate')
      .map((issue) => issue.message) ?? []
  );
};

describe('saleOrderFormSchema order lines', () => {
  const lineIssues = (line: Record<string, unknown>) => {
    const result = saleOrderFormSchema.safeParse({
      ...baseOrder,
      currency: 'KES',
      exchangeRate: 1,
      details: [{ ...baseOrder.details[0], ...line }],
    });

    return (
      result.error?.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      ) ?? []
    );
  };

  it('rejects a non-finite qty', () => {
    expect(lineIssues({ qty: 'Infinity' })).toContain(
      'details.0.qty: Field must be a number',
    );
  });

  it('rejects a non-finite rate', () => {
    expect(lineIssues({ rate: 'Infinity' })).toContain(
      'details.0.rate: Field must be a number',
    );
  });

  it('still accepts ordinary qty and rate values', () => {
    expect(lineIssues({ qty: 40, rate: 850.5 })).toEqual([]);
  });
});

describe('saleOrderFormSchema exchange rate', () => {
  it('rejects a USD order with no exchange rate', () => {
    // This is the state the form lands in when the rate lookup fails and the
    // currency listener clears the field.
    expect(exchangeRateIssues({ ...baseOrder, currency: 'USD' })).toContain(
      'Exchange rate is required when currency is USD',
    );
  });

  it('rejects a USD order whose exchange rate was cleared to an empty string', () => {
    expect(
      exchangeRateIssues({ ...baseOrder, currency: 'USD', exchangeRate: '' }),
    ).toContain('Exchange rate is required when currency is USD');
  });

  it('rejects a USD order with a zero or negative exchange rate', () => {
    expect(
      exchangeRateIssues({ ...baseOrder, currency: 'USD', exchangeRate: 0 }),
    ).toContain('Exchange rate is required when currency is USD');
    expect(
      exchangeRateIssues({ ...baseOrder, currency: 'USD', exchangeRate: -5 }),
    ).toContain('Exchange rate is required when currency is USD');
  });

  it('accepts a USD order with a real exchange rate', () => {
    const result = saleOrderFormSchema.safeParse({
      ...baseOrder,
      currency: 'USD',
      exchangeRate: 130.25,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exchangeRate).toBe(130.25);
    }
  });

  it('accepts a KES order without demanding an exchange rate', () => {
    const result = saleOrderFormSchema.safeParse({
      ...baseOrder,
      currency: 'KES',
      exchangeRate: 1,
    });

    expect(result.success).toBe(true);
  });
});
