import { describe, expect, it } from 'vitest';

import { deriveDisplayStatus, isExited } from './employees.types';

describe('deriveDisplayStatus', () => {
  it('marks active employees on leave today as ON_LEAVE', () => {
    expect(deriveDisplayStatus('ACTIVE', true)).toBe('ON_LEAVE');
    expect(deriveDisplayStatus('ACTIVE', false)).toBe('ACTIVE');
  });

  it('never overrides an exit status with leave', () => {
    expect(deriveDisplayStatus('RESIGNED', true)).toBe('RESIGNED');
    expect(isExited(deriveDisplayStatus('TERMINATED', true))).toBe(true);
  });
});
