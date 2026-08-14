import { describe, expect, it } from 'vitest';

import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_REQUEST_LIMIT,
  RESET_TOKEN_REQUEST_WINDOW_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
  resetRequestWindowStart,
  resetTokenExpiry,
  resetTokenState,
} from '@/features/auth/utils/reset-token';

describe('generateResetToken', () => {
  it('produces a URL-safe token with no padding', () => {
    expect(generateResetToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces a different token on every call', () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateResetToken())
    );

    expect(tokens.size).toBe(50);
  });

  it('produces at least 32 bytes of entropy', () => {
    // 32 bytes base64url-encodes to 43 characters.
    expect(generateResetToken().length).toBeGreaterThanOrEqual(43);
  });
});

describe('hashResetToken', () => {
  it('is stable for the same input', () => {
    const token = generateResetToken();

    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it('differs for different inputs', () => {
    expect(hashResetToken('one')).not.toBe(hashResetToken('two'));
  });

  it('never returns the raw token', () => {
    const token = generateResetToken();

    expect(hashResetToken(token)).not.toContain(token);
  });
});

describe('resetTokenExpiry', () => {
  it('is the configured TTL after the given instant', () => {
    const now = new Date('2026-08-14T10:00:00.000Z');

    expect(resetTokenExpiry(now).toISOString()).toBe(
      '2026-08-14T10:30:00.000Z'
    );
    expect(RESET_TOKEN_TTL_MINUTES).toBe(30);
  });
});

describe('resetRequestWindowStart', () => {
  it('is one hour before the given instant', () => {
    const now = new Date('2026-08-14T10:00:00.000Z');

    expect(resetRequestWindowStart(now).toISOString()).toBe(
      '2026-08-14T09:00:00.000Z'
    );
  });

  it('matches the configured window', () => {
    expect(RESET_TOKEN_REQUEST_WINDOW_MINUTES).toBe(60);
    expect(RESET_TOKEN_REQUEST_LIMIT).toBe(3);
  });
});

describe('resetTokenState', () => {
  const now = new Date('2026-08-14T10:00:00.000Z');

  it('is valid when unused and not yet expired', () => {
    const row = { expiresAt: new Date('2026-08-14T10:00:01.000Z'), usedAt: null };

    expect(resetTokenState(row, now)).toBe('valid');
  });

  it('is expired once the expiry instant has passed', () => {
    const row = { expiresAt: new Date('2026-08-14T09:59:59.000Z'), usedAt: null };

    expect(resetTokenState(row, now)).toBe('expired');
  });

  it('is expired exactly at the expiry instant', () => {
    const row = { expiresAt: new Date(now), usedAt: null };

    expect(resetTokenState(row, now)).toBe('expired');
  });

  it('is used when consumed, even if still within the TTL', () => {
    const row = {
      expiresAt: new Date('2026-08-14T10:29:00.000Z'),
      usedAt: new Date('2026-08-14T09:50:00.000Z'),
    };

    expect(resetTokenState(row, now)).toBe('used');
  });

  it('reports used ahead of expired when both apply', () => {
    const row = {
      expiresAt: new Date('2026-08-14T09:00:00.000Z'),
      usedAt: new Date('2026-08-14T08:55:00.000Z'),
    };

    expect(resetTokenState(row, now)).toBe('used');
  });
});
