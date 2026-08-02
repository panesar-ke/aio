import { describe, expect, it } from 'vitest';

import {
  isNextNotFoundError,
  rethrowIfNextNotFoundError,
} from '@/lib/next-http-errors';

describe('isNextNotFoundError', () => {
  it('recognizes Next.js notFound sentinel errors', () => {
    expect(
      isNextNotFoundError({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      }),
    ).toBe(true);
  });

  it('ignores non-404 and non-Next errors', () => {
    expect(
      isNextNotFoundError({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;403',
      }),
    ).toBe(false);
    expect(isNextNotFoundError(new Error('boom'))).toBe(false);
    expect(isNextNotFoundError(null)).toBe(false);
  });
});

describe('rethrowIfNextNotFoundError', () => {
  it('rethrows the Next.js notFound sentinel', () => {
    const error = {
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    };

    expect(() => rethrowIfNextNotFoundError(error)).toThrow(error);
  });

  it('does nothing for other errors', () => {
    expect(() =>
      rethrowIfNextNotFoundError(new Error('boom')),
    ).not.toThrow();
  });
});
