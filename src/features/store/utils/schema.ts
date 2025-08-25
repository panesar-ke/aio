import { requiredStringSchemaEntry } from '@/lib/schema-rules';
import { z } from 'zod';

export const storeFormSchema = z.object({
  storeName: requiredStringSchemaEntry('Store name is required'),
  description: requiredStringSchemaEntry('Description is required'),
});
