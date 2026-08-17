import { describe, expect, it } from 'vitest';

import { maskEmail } from '@/features/auth/utils/mask-email';

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('jsmith@panesar.co.ke')).toBe('j••••@panesar.co.ke');
  });

  it('masks a two-character local part without revealing the second', () => {
    expect(maskEmail('jo@panesar.co.ke')).toBe('j••••@panesar.co.ke');
  });

  it('uses a fixed number of dots so length is not leaked', () => {
    expect(maskEmail('a@x.com')).toBe('a••••@x.com');
    expect(maskEmail('averylonglocalpart@x.com')).toBe('a••••@x.com');
  });

  it('returns the input unchanged when there is no @', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });
});
