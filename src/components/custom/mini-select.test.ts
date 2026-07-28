import { describe, expect, it } from 'vitest';

import { getMiniSelectRootProps } from '@/components/custom/mini-select';

describe('getMiniSelectRootProps', () => {
  it('controls the select root when a value is provided', () => {
    expect(
      getMiniSelectRootProps({
        disabled: false,
        onChange: undefined,
        defaultValue: 'store-a',
        value: '',
      })
    ).toEqual({
      disabled: false,
      onValueChange: undefined,
      value: '',
    });
  });
});
