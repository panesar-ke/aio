import bcrypt from 'bcryptjs';

export type PasswordVerification =
  | { ok: false }
  | { ok: true; needsRehash: boolean };

/**
 * Verifies a password against its stored hash, preserving case.
 *
 * Hashes written before the casing fix are hashes of lowercased input, so a
 * direct comparison would reject the user's real password. Callers opt into
 * the fallback with `allowLegacyLowercase` — true only while the stored hash
 * is known to predate the fix (`passwordChangedAt IS NULL`). It must never be
 * gated on the exact compare having failed: a hash written after the fix from
 * an all-lowercase password is byte-identical to a legacy one, so an untargeted
 * fallback would accept `WINTERJASMINE24` against `winterjasmine24`, re-hash it
 * as typed, and lock the owner out of their own password.
 *
 * TRANSITIONAL: the fallback and its flag can be deleted once every active
 * account has logged in at least once after this ships.
 */
export async function verifyPassword(
  input: string,
  storedHash: string,
  options: { allowLegacyLowercase: boolean }
): Promise<PasswordVerification> {
  if (await bcrypt.compare(input, storedHash)) {
    return { ok: true, needsRehash: false };
  }

  if (!options.allowLegacyLowercase) {
    return { ok: false };
  }

  const lowercased = input.toLowerCase();
  if (lowercased !== input && (await bcrypt.compare(lowercased, storedHash))) {
    return { ok: true, needsRehash: true };
  }

  return { ok: false };
}
