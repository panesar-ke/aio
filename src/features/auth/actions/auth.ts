'use server';

import bcrypt from 'bcryptjs';
import type z from 'zod';
import db from '@/drizzle/db';
import { loginSchema } from '@/features/auth/actions/schema';
import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/session';

export async function loginAction(unsafeData: z.infer<typeof loginSchema>) {
  const { success, data, error } = loginSchema.safeParse(unsafeData);
  if (!success) {
    return {
      status: 422,
      message: 'Invalid input',
      errors: error.flatten().fieldErrors,
      success: false,
    };
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq, or }) =>
      or(eq(users.email, data.userName), eq(users.contact, data.userName)),
  });

  if (!user) {
    return { success: false, message: 'User not found', status: 404 };
  }

  if (!user.active) {
    return { success: false, message: 'Account is deactivated', status: 403 };
  }

  const isValid = await bcrypt.compare(data.password, user.password);

  if (!isValid) {
    return { success: false, message: 'Invalid credentials', status: 401 };
  }

  await createSession(user.id);

  return redirect(user.defaultMenu || '/dashboard');
}

export async function logoutAction() {
  await deleteSession();
  return redirect('/login');
}
