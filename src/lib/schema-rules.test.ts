import { describe, expect, it } from 'vitest';

import {
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
} from '@/lib/schema-rules';

describe('requiredNumberSchemaEntry', () => {
  it('reports a required message when the field is missing', () => {
    const result = requiredNumberSchemaEntry().safeParse(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Field is required');
    }
  });

  it('reports an invalid-type message when the field is present but not numeric', () => {
    const result = requiredNumberSchemaEntry().safeParse('not-a-number');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Field must be a number');
    }
  });

  it('uses the custom message for a missing field when provided', () => {
    const result =
      requiredNumberSchemaEntry('Qty is required').safeParse(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Qty is required');
    }
  });

  it('accepts a valid positive numeric string', () => {
    const result = requiredNumberSchemaEntry().safeParse('5');

    expect(result).toEqual({ success: true, data: 5 });
  });

  it('rejects non-finite values that survive a NaN check', () => {
    for (const input of ['Infinity', '-Infinity', Infinity, -Infinity]) {
      const result = requiredNumberSchemaEntry().safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Field must be a number');
      }
    }
  });
});

describe('requiredDateSchemaEntry', () => {
  it('reports a required message when the field is missing', () => {
    const result = requiredDateSchemaEntry().safeParse(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });

  it('reports an invalid-date message when the field is present but not a valid date', () => {
    const result = requiredDateSchemaEntry().safeParse('not-a-date');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date must be a valid date');
    }
  });

  it('accepts a valid date string', () => {
    const result = requiredDateSchemaEntry().safeParse('2026-01-01');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
    }
  });
});
