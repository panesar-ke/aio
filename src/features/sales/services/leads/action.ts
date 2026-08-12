'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';

import db from '@/drizzle/db';
import { saleAccounts } from '@/drizzle/schema';
import { getLead } from '@/features/sales/services/leads/data';
import {
  revalidateAccountsTag,
  revalidateLeadsTag,
} from '@/features/sales/utils/cache';
import {
  leadFormSchema,
  type LeadFormValues,
} from '@/features/sales/utils/schemas';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';
import {
  normalizeNullableString,
  normalizeString,
} from '@/lib/string-normalizers';

const buildLeadPayload = (data: LeadFormValues) => {
  return {
    salutation: data.salutation,
    name: normalizeString(data.name),
    company: normalizeString(data.company),
    title: normalizeNullableString(data.title),
    phone: data.phone,
    email: data.email,
    kraPin: data.kraPin,
    leadSource: data.leadSource,
    description: normalizeNullableString(data.description),
    status: data.status,
  };
};

export const upsertLead = async (values: unknown) =>
  runAction('upsert-lead', async () => {
    await requireAnyPermission(['sales:admin', 'sales:standard']);
    const user = await getCurrentUser('action');
    const data = parseOrFail(leadFormSchema, values);

    if (data.id) {
      const lead = await getLead(data.id);

      if (!lead) {
        return {
          error: true,
          message:
            'Could not find the lead. You may not have permission to update it.',
        };
      }

      await db
        .update(saleAccounts)
        .set(buildLeadPayload(data))
        .where(eq(saleAccounts.id, data.id));

      revalidateLeadsTag(data.id);
      revalidatePath('/sales/leads');

      return {
        error: false,
        message: 'Lead updated successfully',
      };
    }

    const [{ id }] = await db
      .insert(saleAccounts)
      .values({ ...buildLeadPayload(data), state: 'lead', salesRepId: user.id })
      .returning({ id: saleAccounts.id });

    revalidateLeadsTag(id);
    revalidatePath('/sales/leads');

    return {
      error: false,
      message: 'Lead created successfully',
    };
  });

export const convertToCustomer = async (
  prevState: { error: boolean; message: string | null },
  formData: FormData,
) => {
  const validatedFileds = z.string().safeParse(formData.get('leadId'));
  if (!validatedFileds.success) {
    return {
      error: true,
      message: 'Invalid request',
    };
  }
  await requireAnyPermission(['sales:admin', 'sales:standard']);
  try {
    const lead = await getLead(validatedFileds.data);
    if (!lead) {
      return {
        error: true,
        message:
          'Could not find the lead. You may not have permission to delete it.',
      };
    }
    await db
      .update(saleAccounts)
      .set({ state: 'account' })
      .where(eq(saleAccounts.id, validatedFileds.data));

    revalidateLeadsTag(validatedFileds.data);
    revalidateAccountsTag(validatedFileds.data);
    revalidatePath('/sales/leads');
    revalidatePath('/sales/accounts');

    return {
      error: false,
      message: 'Lead converted successfully',
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: 'Failed to convert lead to customer. Please try again.',
    };
  }
};

export const deleteLead = async (leadId: string) =>
  runAction('delete-lead', async () => {
    await requirePermission('sales:admin');

    const lead = await getLead(leadId);

    if (!lead)
      return {
        error: true,
        message:
          'Could not find the lead. You may not have permission to delete it.',
      };

    await db.delete(saleAccounts).where(eq(saleAccounts.id, leadId));
    revalidateLeadsTag(leadId);
    revalidatePath('/sales/leads');

    return {
      error: false,
      message: 'Lead deleted successfully',
    };
  });
