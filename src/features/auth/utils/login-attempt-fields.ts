/**
 * Bounds on the client-controlled strings that reach `login_attempts`.
 *
 * Every submission that gets as far as a password check writes a row keyed on
 * `identifier`, which is the leading column of a btree index. An oversized
 * identifier is therefore not merely a storage cost: Postgres refuses the
 * insert outright ("index row size ... exceeds btree maximum"), the throttle
 * never counts the attempt, and the shared invalid-credentials message the
 * login path is built around is replaced by a generic failure.
 *
 * `loginSchema` refuses an over-long identifier before any of that happens;
 * the bounds are re-applied at the insert so the table holds regardless of
 * which caller reached it.
 */

/** RFC 5321's maximum forward-path length. Nothing longer is an identifier. */
export const MAX_LOGIN_IDENTIFIER_LENGTH = 254;

/** An IPv6 address with an embedded IPv4 one — the longest textual form. */
export const MAX_LOGIN_IP_ADDRESS_LENGTH = 45;

/** Audit only, and nothing reads it back, so a generous bound is enough. */
export const MAX_LOGIN_USER_AGENT_LENGTH = 512;

/**
 * Bounds one nullable audit string, mapping empty and missing alike to null so
 * "unknown" is a single value in the column rather than a mix of NULL and ''.
 */
export function boundedAuditField(
  value: string | null | undefined,
  maxLength: number,
) {
  if (!value) return null;

  return value.slice(0, maxLength);
}
