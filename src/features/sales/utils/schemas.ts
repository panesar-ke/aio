import z from 'zod';

import { LEAD_STATUS, SALUTATIONS } from '@/features/sales/utils/constants';
import {
  nullableTrimmedString,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const leadFormSchema = z.object({
  id: nullableTrimmedString,
  salutation: z
    .enum(SALUTATIONS, {
      error: (iss) =>
        iss.input ? 'Invalid salutation' : 'Salutation is required',
    })
    .nullable()
    .transform((value) => (value === undefined ? null : value)),
  name: requiredTrimmedStringSchemaEntry('Name is required'),
  company: requiredTrimmedStringSchemaEntry('Company is required'),
  email: nullableTrimmedString,
  phone: nullableTrimmedString,
  leadSource: nullableTrimmedString,
  title: nullableTrimmedString,
  description: nullableTrimmedString,
  status: z.enum(
    LEAD_STATUS.map((s) => s.value),
    {
      error: (iss) =>
        iss.input ? 'Invalid lead status' : 'Status is required',
    },
  ),

  kraPin: nullableTrimmedString.refine(
    (value) => !value || /^\d{9}[A-Za-z]?$/.test(value),
    'Invalid KRA PIN format',
  ),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
