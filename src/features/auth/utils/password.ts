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
 * TRANSITIONAL: the fallback, its flag, and the equalizing second comparison
 * below can be deleted together once every active account has logged in at
 * least once after this ships.
 */
export async function verifyPassword(
  input: string,
  storedHash: string,
  options: { allowLegacyLowercase: boolean }
): Promise<PasswordVerification> {
  const lowercased = input.toLowerCase();

  // Both comparisons run on every path, unconditionally, and neither result is
  // read until both are in hand. Running the second one only when the fallback
  // could use it made the number of bcrypt operations depend on the account:
  // one for a hash written since the fix, two for a legacy hash and a
  // mixed-case input. At BCRYPT_ROUNDS that is ~100ms of measurable difference,
  // which rebuilds the enumeration oracle loginAction's dummy-hash comparison
  // exists to close. When `lowercased === input` the second comparison is pure
  // cost — that is the point of it.
  const exact = await bcrypt.compare(input, storedHash);
  const legacy = await bcrypt.compare(lowercased, storedHash);

  if (exact) {
    return { ok: true, needsRehash: false };
  }

  if (options.allowLegacyLowercase && lowercased !== input && legacy) {
    return { ok: true, needsRehash: true };
  }

  return { ok: false };
}
