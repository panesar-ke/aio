import z from 'zod';
import {
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules';

export const userRightsFormSchema = z.object({
  userId: requiredStringSchemaEntry('User is required'),
  rights: z.array(
    z.object({
      formId: requiredNumberSchemaEntry('Form is required'),
      hasAccess: z.boolean(),
    })
  ),
});

export const cloneUserRightsFormSchema = z
  .object({
    cloningFrom: requiredStringSchemaEntry('Cloning from user is required'),
    cloningTo: requiredStringSchemaEntry('Cloning to user is required'),
  })
  .superRefine((data, ctx) => {
    if (data.cloningFrom === data.cloningTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cloning from and to users must be different',
        path: ['cloningTo'],
      });
    }
  });
