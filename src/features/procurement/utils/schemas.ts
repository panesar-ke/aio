import z from 'zod'
import {
  optionalNumberSchemaEntry,
  optionalStringSchemaEntry,
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules'
import { addDays } from 'date-fns'

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

export const orderSchema = z
  .object({
    documentNo: requiredNumberSchemaEntry('Document no is required.'),
    documentDate: requiredDateSchemaEntry().max(
      addDays(new Date(), 1),
      'Date cannot be later than today.',
    ),
    vendor: requiredStringSchemaEntry('Vendor is required'),
    invoiceNo: optionalStringSchemaEntry(),
    vatType: z.enum(['NONE', 'INCLUSIVE', 'EXCLUSIVE'], {
      required_error: 'Select vat',
    }),
    vat: optionalStringSchemaEntry(),
    invoiceDate: z.coerce.date().optional(),
    displayOdometerDetails: z.boolean(),
    vehicle: z.coerce.number().optional(),
    details: z.array(
      z
        .object({
          id: requiredStringSchemaEntry('ID is required'),
          type: z.enum(['item', 'service']),
          itemOrServiceId: requiredStringSchemaEntry('Field is required'),
          requestId: requiredStringSchemaEntry('Request ID is required'),
          projectId: requiredStringSchemaEntry('Project is required'),
          qty: requiredNumberSchemaEntry('Qty is required'),
          rate: requiredNumberSchemaEntry('Rate is required'),
          discountType: z.enum(['NONE', 'PERCENTAGE', 'AMOUNT']).optional(),
          discount: optionalNumberSchemaEntry(),
        })
        .superRefine(({ discount, discountType }, ctx) => {
          if (discountType !== 'NONE' && !discount) {
            ctx.addIssue({
              code: 'custom',
              path: ['discount'],
              message: 'Discount is required when discount type is not NONE',
            })
          }
        }),
    ),
  })
  .superRefine(({ documentDate, invoiceDate, vat, vatType }, ctx) => {
    if (documentDate && invoiceDate && documentDate > invoiceDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['invoiceDate'],
        message: 'Invoice date cannot be earlier than document date',
      })
    }
    if (vatType !== 'NONE' && !vat) {
      ctx.addIssue({
        code: 'custom',
        path: ['vat'],
        message: 'VAT is required',
      })
    }
  })
