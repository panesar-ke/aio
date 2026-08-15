import { describe, expect, it } from 'vitest';

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from '@/features/auth/actions/schema';
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
      currentPassword: 'OldPassphrase123',
      newPassword: 'NewPassphrase456',
      confirmPassword: 'NewPassphrase456',
    });

    expect(parsed.currentPassword).toBe('OldPassphrase123');
    expect(parsed.newPassword).toBe('NewPassphrase456');
  });

  it('rejects a confirmation that differs only by case', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPassphrase123',
      newPassword: 'NewPassphrase456',
      confirmPassword: 'newpassphrase456',
    });

    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts an email address', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: 'jsmith@panesar.co.ke' })
        .identifier
    ).toBe('jsmith@panesar.co.ke');
  });

  it('accepts a contact number', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: '0712345678' }).identifier
    ).toBe('0712345678');
  });

  it('lowercases and trims so lookup is case-insensitive', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: '  JSmith@Panesar.co.ke ' })
        .identifier
    ).toBe('jsmith@panesar.co.ke');
  });

  it('rejects an empty identifier', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '' }).success).toBe(
      false
    );
  });
});

describe('resetPasswordSchema', () => {
  const valid = {
    token: 'a-token',
    newPassword: 'NewPassphrase456',
    confirmPassword: 'NewPassphrase456',
  };

  it('accepts a matching pair and preserves case', () => {
    const parsed = resetPasswordSchema.parse(valid);

    expect(parsed.newPassword).toBe('NewPassphrase456');
  });

  it('rejects a mismatched confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'DifferentPass1',
    });

    expect(result.success).toBe(false);
  });

  it('puts the mismatch error on the confirmation field', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'DifferentPass1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });

  it('rejects a password shorter than 12 characters', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'a-token',
      newPassword: 'ElevenChar1',
      confirmPassword: 'ElevenChar1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing token', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, token: '' });

    expect(result.success).toBe(false);
  });
});
