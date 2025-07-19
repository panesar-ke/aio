import z from 'zod'
import {
  optionalStringSchemaEntry,
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules'

export const materialRequisitionFormSchema = z.object({
  documentNo: requiredNumberSchemaEntry('Document No is required'),
  documentDate: requiredDateSchemaEntry(),
  details: z.array(
    z.object({
      id: requiredStringSchemaEntry('ID is required'),
      projectId: requiredStringSchemaEntry('Project is required'),
      type: z.enum(['item', 'service']),
      itemOrServiceId: requiredStringSchemaEntry('Field is required'),
      qty: requiredNumberSchemaEntry('Qty is required'),
      remarks: optionalStringSchemaEntry(),
      requestId: requiredNumberSchemaEntry('Request ID is required'),
    }),
  ),
})
