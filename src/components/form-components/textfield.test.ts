import { describe, expect, it } from 'vitest';

import { coerceTextFieldValue } from '@/components/form-components/textfield';

describe('coerceTextFieldValue', () => {
  it('keeps cleared number inputs empty', () => {
    expect(coerceTextFieldValue('number', '')).toBe('');
  });
});
