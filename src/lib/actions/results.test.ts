import { describe, expect, it } from 'vitest';

import { redirectActionResult } from '@/lib/actions/results';

describe('redirectActionResult', () => {
  it('returns a success result with a redirect target for client-side navigation', () => {
    expect(
      redirectActionResult('/store/grn', 'GRN created successfully.')
    ).toEqual({
      error: false,
      message: 'GRN created successfully.',
      redirectTo: '/store/grn',
    });
  });
});
