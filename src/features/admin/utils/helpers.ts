import bcrypt from 'bcryptjs';
import { env } from '@/env/server';

export const generatePassword = (length: number) => {
  const characters =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, Number(env.BCRYPT_ROUNDS));
};
