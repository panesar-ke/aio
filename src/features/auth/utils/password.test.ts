import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { verifyPassword } from '@/features/auth/utils/password';

// Cost 4 keeps the suite fast; production rounds come from env.BCRYPT_ROUNDS.
const hash = (value: string) => bcrypt.hash(value, 4);

describe('verifyPassword', () => {
  it('accepts a password matching the stored hash exactly', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('CorrectHorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: false,
    });
  });

  it('accepts a legacy hash of lowercased input and asks for a re-hash', async () => {
    // How every hash written through the old change-password form was created.
    const stored = await hash('correcthorse9');

    await expect(verifyPassword('CorrectHorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: true,
    });
  });

  it('does not ask for a re-hash when the password is already lowercase', async () => {
    const stored = await hash('correcthorse9');

    await expect(verifyPassword('correcthorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: false,
    });
  });

  it('rejects a genuinely wrong password', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('WrongHorse9', stored)).resolves.toEqual({
      ok: false,
    });
  });

  it('rejects a wrong password that differs only by case from nothing stored', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('CORRECTHORSE9', stored)).resolves.toEqual({
      ok: false,
    });
  });
});
