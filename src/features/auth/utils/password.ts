import bcrypt from 'bcryptjs';

export type PasswordVerification =
  | { ok: false }
  | { ok: true; needsRehash: boolean };

/**
 * Verifies a password against its stored hash, preserving case.
 *
 * Hashes written before the casing fix are hashes of lowercased input, so a
 * direct comparison would reject the user's real password. When the lowercased
 * variant matches, the caller is told to re-hash the input exactly as typed —
 * each legacy account self-heals on its owner's next login.
 *
 * TRANSITIONAL: the lowercase fallback can be deleted once every active
 * account has logged in at least once after this ships.
 */
export async function verifyPassword(
  input: string,
  storedHash: string
): Promise<PasswordVerification> {
  if (await bcrypt.compare(input, storedHash)) {
    return { ok: true, needsRehash: false };
  }

  const lowercased = input.toLowerCase();
  if (lowercased !== input && (await bcrypt.compare(lowercased, storedHash))) {
    return { ok: true, needsRehash: true };
  }

  return { ok: false };
}
