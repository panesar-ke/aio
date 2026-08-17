import { createHash, randomBytes } from 'node:crypto';

export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_TOKEN_REQUEST_LIMIT = 3;
export const RESET_TOKEN_REQUEST_WINDOW_MINUTES = 60;

export type ResetTokenState = 'valid' | 'expired' | 'used';

/**
 * Crypto-grade token for a reset link. Deliberately not `generatePassword`
 * from the admin helpers — that draws from `Math.random()`.
 */
export function generateResetToken() {
  return randomBytes(32).toString('base64url');
}

/** Only the hash is ever stored, so a leaked backup yields no usable links. */
export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function resetTokenExpiry(now: Date) {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

/** Start of the trailing window the request throttle counts within. */
export function resetRequestWindowStart(now: Date) {
  return new Date(
    now.getTime() - RESET_TOKEN_REQUEST_WINDOW_MINUTES * 60 * 1000
  );
}

export function resetTokenState(
  row: { expiresAt: Date; usedAt: Date | null },
  now: Date
): ResetTokenState {
  if (row.usedAt !== null) {
    return 'used';
  }

  return row.expiresAt.getTime() > now.getTime() ? 'valid' : 'expired';
}
