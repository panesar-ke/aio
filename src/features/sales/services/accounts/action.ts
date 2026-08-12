'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import db from '@/drizzle/db';
import { saleAccounts } from '@/drizzle/schema';
import { getAccount } from '@/features/sales/services/accounts/data';
import { revalidateAccountsTag } from '@/features/sales/utils/cache';
import {
  accountFormSchema,
  type AccountFormValues,
} from '@/features/sales/utils/schemas';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import { requireAnyPermission } from '@/lib/permissions/guards';
import {
  normalizeNullableString,
  normalizeString,
} from '@/lib/string-normalizers';

const buildAccountPayload = (data: AccountFormValues) => {
  return {
    salutation: data.salutation,
    name: normalizeString(data.name),
    company: normalizeString(data.company),
    title: normalizeNullableString(data.title),
    phone: data.phone,
    email: data.email,
    kraPin: data.kraPin,
    description: normalizeNullableString(data.description),
  };
};

export const upsertAccount = async (values: unknown) =>
  runAction('upsert-account', async () => {
    await requireAnyPermission(['sales:admin', 'sales:standard']);
    const data = parseOrFail(accountFormSchema, values);

    if (!data.id) {
      return {
        error: true,
        message: 'Account id is required.',
      };
    }

    const account = await getAccount(data.id);

    if (!account) {
      return {
        error: true,
        message:
          'Could not find the account. You may not have permission to update it.',
      };
    }

    await db
      .update(saleAccounts)
      .set(buildAccountPayload(data))
      .where(eq(saleAccounts.id, data.id));

    revalidateAccountsTag(data.id);
    revalidatePath('/sales/accounts');
    revalidatePath(`/sales/accounts/${data.id}/details`);

    return {
      error: false,
      message: 'Account updated successfully',
    };
  });
