import 'server-only';

import db from '@/drizzle/db';
import { CURRENT_POLICY_VERSION } from '@/features/auth/utils/password-policy';
import {
  hashResetToken,
  resetTokenState,
} from '@/features/auth/utils/reset-token';

export async function findValidResetToken(token: string) {
  const row = await db.query.passwordResetTokens.findFirst({
    columns: { id: true, userId: true, expiresAt: true, usedAt: true },
    where: (table, { eq }) => eq(table.tokenHash, hashResetToken(token)),
  });

  if (!row) {
    return null;
  }

  if (resetTokenState(row, new Date()) !== 'valid') {
    return null;
  }

  return { id: row.id, userId: row.userId };
}

/**
 * Active users the deadline will actually gate. Anyone exempt past the
 * deadline is excluded: they are never gated by it, so reminding them would
 * be noise.
 */
export async function findUsersNeedingPolicyReminder(deadline: Date) {
  return db.query.users.findMany({
    columns: { id: true },
    where: (table, { and, eq, isNull, lt, lte, or }) =>
      and(
        eq(table.active, true),
        lt(table.passwordPolicyVersion, CURRENT_POLICY_VERSION),
        or(
          isNull(table.passwordPolicyExemptUntil),
          lte(table.passwordPolicyExemptUntil, deadline),
        ),
      ),
  });
}
