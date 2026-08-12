'use client';

import { useSelector } from '@tanstack/react-store';
import { useRouter } from 'next/navigation';

import type { Account } from '@/features/sales/utils/sales.types';

import { FooterFormActions } from '@/components/custom/form-actions';
import { FormSectionHeader } from '@/components/custom/form-header';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { upsertAccount } from '@/features/sales/services/accounts/action';
import { SALUTATIONS } from '@/features/sales/utils/constants';
import {
  accountFormSchema,
  type AccountFormValues,
} from '@/features/sales/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { titleCase } from '@/lib/helpers/formatters';

export function buildAccountDefaultValues(
  account?: Account,
): AccountFormValues {
  return {
    id: account?.id ?? null,
    name: account?.name ?? '',
    company: account?.company ?? '',
    email: account?.email ?? null,
    phone: account?.phone ?? null,
    title: account?.title ? titleCase(account.title.toLowerCase()) : null,
    description: account?.description ?? null,
    kraPin: account?.kraPin ?? null,
    salutation: account?.salutation ?? null,
  };
}

export function AccountForm({ account }: { account: Account }) {
  const router = useRouter();
  const form = useAppForm({
    defaultValues: buildAccountDefaultValues(account),
    validators: {
      onSubmit: accountFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertAccount(value),
        errorTitle: 'Error updating account',
        successTitle: '✅ Updated',
        fallbackMessage: 'Failed to update account. Please try again.',
        onSuccess: () => {
          router.push('/sales/accounts');
        },
      });
    },
  });
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='flex-1 space-y-6 overflow-y-auto pb-6 max-w-3xl'
      >
        <section className='bg-card border rounded-lg overflow-hidden'>
          <FormSectionHeader
            title='Contact Details'
            description='Update the main contact information for this account.'
          />
          <FieldGroup className='p-6 grid md:grid-cols-2 gap-6'>
            <form.AppField name='salutation'>
              {(field) => (
                <field.Select
                  label='Salutation'
                  placeholder='Select salutation'
                >
                  {SALUTATIONS.map((s) => (
                    <SelectItem value={s} key={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </field.Select>
              )}
            </form.AppField>
            <form.AppField name='name'>
              {(field) => (
                <field.Input
                  required
                  label='Name'
                  placeholder='e.g. John Doe'
                />
              )}
            </form.AppField>
            <form.AppField name='company'>
              {(field) => (
                <field.Input
                  required
                  label='Company Name'
                  placeholder='e.g. ABC Limited'
                />
              )}
            </form.AppField>
            <form.AppField name='title'>
              {(field) => (
                <field.Input label='Title' placeholder='e.g. Director' />
              )}
            </form.AppField>
            <form.AppField name='phone'>
              {(field) => (
                <field.Input label='Phone' placeholder='e.g. 0700000000' />
              )}
            </form.AppField>
            <form.AppField name='email'>
              {(field) => (
                <field.Input
                  type='email'
                  label='Email'
                  placeholder='test@example.com'
                />
              )}
            </form.AppField>
            <form.AppField name='kraPin'>
              {(field) => (
                <field.Input
                  fieldClassName='col-span-full'
                  label='KRA PIN'
                  placeholder='e.g. A123456789B'
                />
              )}
            </form.AppField>
          </FieldGroup>
        </section>

        <section className='bg-card border rounded-lg overflow-hidden'>
          <FormSectionHeader
            title='Account Notes'
            description='Internal notes that help the sales team manage the account.'
          />
          <FieldGroup className='p-6 grid gap-6'>
            <form.AppField name='description'>
              {(field) => (
                <field.Textarea
                  fieldClassName='col-span-full'
                  label='Description'
                  placeholder='Important notes, buying patterns, or commercial context...'
                />
              )}
            </form.AppField>
          </FieldGroup>
        </section>
      </form>
      <FooterFormActions
        handleReset={form.reset}
        isSubmitting={isSubmitting}
        handleSubmit={form.handleSubmit}
        saveText='Update Account'
        buttonGroupClassName='max-w-3xl'
      />
    </div>
  );
}
