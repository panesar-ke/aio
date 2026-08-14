import 'server-only';

import db from '@/drizzle/db';
import { hashResetToken, resetTokenState } from '@/features/auth/utils/reset-token';

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
