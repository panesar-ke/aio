import type { SQL } from 'drizzle-orm';

import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '@/lib/permissions/errors';
import { sessions } from '@/drizzle/schema';

const { deleteWhere, revalidatePath, revalidateTag, requirePermission, getCurrentUser } =
  vi.hoisted(() => ({
    deleteWhere: vi.fn((whereClause: SQL) => whereClause),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    requirePermission: vi.fn(),
    getCurrentUser: vi.fn(),
  }));

vi.mock('next/cache', () => ({
  revalidatePath,
  revalidateTag,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/drizzle/db', () => ({
  default: {
    delete: vi.fn(() => ({
      where: deleteWhere,
    })),
  },
}));

vi.mock('@/lib/permissions/guards', () => ({
  requirePermission,
}));

vi.mock('@/lib/session', () => ({
  getCurrentUser,
}));

vi.mock('@/features/admin/services/data', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/features/admin/utils/cache', () => ({
  getActiveSessionsGlobalTag: vi.fn(() => 'active-sessions'),
  getUserFormsGlobalTag: vi.fn(),
  revalidateUserTags: vi.fn(),
}));

vi.mock('@/features/admin/utils/helpers', () => ({
  generatePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('@/features/admin/utils/schema', () => ({
  cloneUserRightsFormSchema: {},
  userRightsFormSchema: {},
  userSchema: {},
}));

vi.mock('@/inngest/client', () => ({
  inngest: {},
}));

vi.mock('@/inngest/events', () => ({
  sendNewPasswordEvent: vi.fn(),
}));

vi.mock('@/lib/action-validator', () => ({
  validateFields: vi.fn(),
}));

vi.mock('@/lib/helpers/formatters', () => ({
  internationalizePhoneNumber: vi.fn(),
  titleCase: vi.fn(),
}));

vi.mock('@/lib/permissions/service', () => ({
  normalizePermissions: vi.fn(),
}));

import { revokeSession } from '@/features/admin/services/action';

describe('revokeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue(undefined);
    getCurrentUser.mockResolvedValue({
      session: {
        sessionId: 'current-session',
      },
    });
  });

  it('fails when authorization is denied', async () => {
    requirePermission.mockRejectedValueOnce(new ForbiddenError());

    const result = await revokeSession('other-session');

    expect(result).toEqual({
      error: true,
      message: 'You do not have permission to perform this action.',
    });
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it('rejects bulk revocation when the current session is included', async () => {
    const result = await revokeSession(['other-session', 'current-session']);

    expect(result).toEqual({
      error: true,
      message: 'You cannot revoke your current session.',
    });
    expect(deleteWhere).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('revokes a single session by id and invalidates admin caches', async () => {
    const result = await revokeSession('other-session');

    expect(result).toEqual({
      error: false,
      message: 'Session revoked successfully',
    });
    expect(deleteWhere).toHaveBeenCalledOnce();
    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(deleteWhere.mock.calls[0][0] as SQL);
    expect(query.sql).toContain('"sessions"."id" = $1');
    expect(query.params).toEqual(['other-session']);
    expect(getCurrentUser).toHaveBeenCalledWith('action');
    expect(revalidateTag).toHaveBeenCalledWith('active-sessions', 'max');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/active-sessions');
  });

  it('revokes multiple sessions with an in-array delete', async () => {
    const result = await revokeSession(['other-session', 'another-session']);

    expect(result).toEqual({
      error: false,
      message: 'Session revoked successfully',
    });
    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(deleteWhere.mock.calls[0][0] as SQL);
    expect(query.sql).toContain('"sessions"."id" in ($1, $2)');
    expect(query.params).toEqual(['other-session', 'another-session']);
  });
});
