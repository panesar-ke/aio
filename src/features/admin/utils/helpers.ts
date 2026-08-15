import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

import { env } from '@/env/server';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/utils/password-policy';

export const generatePassword = (length: number = MIN_PASSWORD_LENGTH) => {
  const characters =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
  let password = '';
  for (let i = 0; i < Math.max(length, MIN_PASSWORD_LENGTH); i++) {
    password += characters[randomInt(characters.length)];
  }
  return password;
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, Number(env.BCRYPT_ROUNDS));
};
