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
