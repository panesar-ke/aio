import { describe, expect, it } from 'vitest';

import { isEligibleForDeactivation } from '@/features/store/services/product-deactivation/eligibility';

const asOf = new Date('2026-07-31T00:00:00.000Z');
const THRESHOLD = 365;

describe('isEligibleForDeactivation', () => {
  it('is eligible when real usage exists and is older than the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: new Date('2025-01-01'), createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('is not eligible when real usage exists within the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: new Date('2026-06-01'), createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });

  it('is eligible immediately when there is zero usage and createdOn is null (legacy product)', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('is not eligible when there is zero usage, createdOn is set, and createdOn is within the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: new Date('2026-06-01') },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });

  it('is eligible when there is zero usage, createdOn is set, and createdOn is older than the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: new Date('2025-01-01') },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('treats a usage date exactly at the threshold boundary as not yet eligible', () => {
    const boundary = new Date(asOf);
    boundary.setUTCDate(boundary.getUTCDate() - THRESHOLD);
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: boundary, createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });
});
