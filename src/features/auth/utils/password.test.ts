import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { verifyPassword } from '@/features/auth/utils/password';

// Cost 4 keeps the suite fast; production rounds come from env.BCRYPT_ROUNDS.
const hash = (value: string) => bcrypt.hash(value, 4);

const legacy = { allowLegacyLowercase: true };
const current = { allowLegacyLowercase: false };

describe('verifyPassword', () => {
  it('accepts a password matching the stored hash exactly', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(
      verifyPassword('CorrectHorse9', stored, current)
    ).resolves.toEqual({ ok: true, needsRehash: false });
  });

  it('accepts a legacy hash of lowercased input and asks for a re-hash', async () => {
    // How every hash written through the old change-password form was created.
    const stored = await hash('correcthorse9');

    await expect(
      verifyPassword('CorrectHorse9', stored, legacy)
    ).resolves.toEqual({ ok: true, needsRehash: true });
  });

  it('does not ask for a re-hash when the password is already lowercase', async () => {
    const stored = await hash('correcthorse9');

    await expect(
      verifyPassword('correcthorse9', stored, legacy)
    ).resolves.toEqual({ ok: true, needsRehash: false });
  });

  it('rejects a genuinely wrong password', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('WrongHorse9', stored, legacy)).resolves.toEqual(
      { ok: false }
    );
  });

  it('rejects a wrong password that differs only by case from nothing stored', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(
      verifyPassword('CORRECTHORSE9', stored, legacy)
    ).resolves.toEqual({ ok: false });
  });

  it('rejects a mis-cased attempt against a current all-lowercase password', async () => {
    // The lockout this flag exists to prevent: without it, Caps Lock would
    // verify, trigger a re-hash of the shouted form, and lock the owner out.
    const stored = await hash('winterjasmine24');

    await expect(
      verifyPassword('WINTERJASMINE24', stored, current)
    ).resolves.toEqual({ ok: false });
  });

  it('still accepts the exact password once the fallback is closed', async () => {
    const stored = await hash('winterjasmine24');

    await expect(
      verifyPassword('winterjasmine24', stored, current)
    ).resolves.toEqual({ ok: true, needsRehash: false });
  });
});
