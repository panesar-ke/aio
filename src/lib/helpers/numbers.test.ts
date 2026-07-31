import Big from 'big.js';
import { describe, expect, it } from 'vitest';

import {
  toBig,
  toDecimalString,
  toNullableNumber,
  toNullableString,
  toNullishNumber,
} from '@/lib/helpers/numbers';

describe('toNullableString', () => {
  it('returns null for nullish values', () => {
    expect(toNullableString(null)).toBeNull();
    expect(toNullableString(undefined)).toBeNull();
  });

  it('formats non-nullish values like toDecimalString', () => {
    expect(toNullableString('12.345', 2)).toBe(toDecimalString('12.345', 2));
    expect(toNullableString(new Big('7.1'), 3)).toBe(
      toDecimalString(new Big('7.1'), 3),
    );
  });

  it('keeps forgiving fallback behavior for invalid non-nullish input', () => {
    expect(toNullableString('not-a-number', 2)).toBe('0.00');
  });
});

describe('toNullishNumber', () => {
  it('returns null for nullish values', () => {
    expect(toNullishNumber(null)).toBeNull();
    expect(toNullishNumber(undefined)).toBeNull();
  });

  it('matches toBig number conversion for non-nullish values', () => {
    expect(toNullishNumber('12.34')).toBe(toBig('12.34').toNumber());
    expect(toNullishNumber('not-a-number')).toBe(0);
    expect(toNullishNumber('')).toBe(0);
  });
});

describe('toNullableNumber', () => {
  it('returns null for invalid or empty input', () => {
    expect(toNullableNumber('')).toBeNull();
    expect(toNullableNumber('not-a-number')).toBeNull();
  });
});
