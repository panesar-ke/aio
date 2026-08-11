'use client';
import { useSelector } from '@tanstack/react-store';
import { useRouter } from 'next/navigation';

import type { Lead } from '@/features/sales/utils/sales.types';

import { FooterFormActions } from '@/components/custom/form-actions';
import { FormSectionHeader } from '@/components/custom/form-header';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import {
  LEAD_SOURCE,
  LEAD_STATUS,
  SALUTATIONS,
} from '@/features/sales/utils/constants';
import {
  leadFormSchema,
  type LeadFormValues,
} from '@/features/sales/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { titleCase } from '@/lib/helpers/formatters';

import { upsertLead } from '../../services/leads/action';

const buildDefaultValues = (lead?: Lead): LeadFormValues => {
  return {
    id: lead?.id ?? null,
    name: lead?.name ? titleCase(lead.name.toLowerCase()) : '',
    company: lead?.company ? titleCase(lead.company.toLowerCase()) : '',
    email: lead?.email ?? null,
    phone: lead?.phone ?? null,
    leadSource: lead?.leadSource ?? null,
    description: lead?.description ?? null,
    kraPin: lead?.kraPin ?? null,
    status: lead?.status ?? 'new',
    salutation: lead?.salutation ?? null,
    title: lead?.title ? titleCase(lead.title.toLowerCase()) : null,
  };
};

export function LeadForm({ lead }: { lead?: Lead }) {
  const isEdit = !!lead;
  const router = useRouter();
  const form = useAppForm({
    defaultValues: buildDefaultValues(lead) as LeadFormValues,
    validators: {
      onSubmit: leadFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertLead(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} lead`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} lead. Please try again.`,
        onSuccess: () => {
          form.reset();
          router.push('/sales/leads');
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
            description='Who they are and how to reach them.'
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
                <field.Input
                  label='Phone'
                  required
                  placeholder='e.g. 0700000000'
                />
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
            title='Qualification'
            description="Where this lead came from and how it's progressing."
          />
          <FieldGroup className='p-6 grid md:grid-cols-2 gap-6'>
            <form.AppField name='status'>
              {(field) => (
                <field.Select
                  label='Status'
                  placeholder='Select status'
                  required
                >
                  {LEAD_STATUS.map(({ label, value }) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </field.Select>
              )}
            </form.AppField>
            <form.AppField name='leadSource'>
              {(field) => (
                <field.Select
                  label='Lead Source'
                  placeholder='Select lead source'
                >
                  {LEAD_SOURCE.map(({ label, value }) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </field.Select>
              )}
            </form.AppField>
            <form.AppField name='description'>
              {(field) => (
                <field.Textarea
                  fieldClassName='col-span-full'
                  label='Description'
                  placeholder='Notes on the conversation, needs, timeline...'
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
        saveText={isEdit ? 'Update Lead' : 'Create Lead'}
        buttonGroupClassName='max-w-3xl'
      />
    </div>
  );
}
