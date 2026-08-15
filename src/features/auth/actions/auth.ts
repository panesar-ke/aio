'use server';

import type { Route } from 'next';
import type z from 'zod';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import db from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { hashPassword } from '@/features/admin/utils/helpers';
import { loginSchema } from '@/features/auth/actions/schema';
import { verifyPassword } from '@/features/auth/utils/password';
import {
  checkPasswordPolicy,
  CURRENT_POLICY_VERSION,
  isPolicyCompliant,
} from '@/features/auth/utils/password-policy';
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

  const verification = await verifyPassword(data.password, user.password);

  if (!verification.ok) {
    return { success: false, message: 'Invalid credentials', status: 401 };
  }

  // TRANSITIONAL: this hash predates the casing fix and is a hash of
  // lowercased input. Re-store it as typed so the account self-heals.
  // Opportunistic only: a failure here must never block a valid login.
  if (verification.needsRehash) {
    try {
      await db
        .update(users)
        .set({ password: await hashPassword(data.password) })
        .where(eq(users.id, user.id));
    } catch (rehashError) {
      console.error('Failed to self-heal password hash:', rehashError);
    }
  }

  let compliant = isPolicyCompliant(user.passwordPolicyVersion);

  // The plaintext is only available here, so this is the one place an existing
  // password can be judged against the policy without forcing a change.
  if (!compliant && checkPasswordPolicy(data.password, user).length === 0) {
    await db
      .update(users)
      .set({ passwordPolicyVersion: CURRENT_POLICY_VERSION })
      .where(eq(users.id, user.id));

    compliant = true;
  }

  await createSession(user.id, { policyCompliant: compliant });

  return redirect((user.defaultMenu as Route) || ('/dashboard' as Route));
}

export async function logoutAction() {
  await deleteSession();
  return redirect('/login');
}
