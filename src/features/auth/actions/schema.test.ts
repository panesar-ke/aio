import { describe, expect, it } from 'vitest';

import { loginSchema } from '@/features/auth/actions/schema';
import { changePasswordSchema } from '@/features/change-password/utils/schema';

describe('loginSchema', () => {
  it('preserves password case', () => {
    const parsed = loginSchema.parse({
      userName: 'JSmith@Panesar.co.ke',
      password: 'xY7@2kQz',
    });

    expect(parsed.password).toBe('xY7@2kQz');
  });

  it('still lowercases the identifier, which is case-insensitive', () => {
    const parsed = loginSchema.parse({
      userName: 'JSmith@Panesar.co.ke',
      password: 'xY7@2kQz',
    });

    expect(parsed.userName).toBe('jsmith@panesar.co.ke');
  });

  it('rejects an empty password', () => {
    expect(
      loginSchema.safeParse({ userName: 'a@b.com', password: '' }).success
    ).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('preserves case on both password fields', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'NewPass456',
    });

    expect(parsed.currentPassword).toBe('OldPass123');
    expect(parsed.newPassword).toBe('NewPass456');
  });

  it('rejects a confirmation that differs only by case', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'newpass456',
    });

    expect(result.success).toBe(false);
  });
});
