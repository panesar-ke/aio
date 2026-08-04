import { z } from 'zod';

import { requiredStringSchemaEntry } from '@/lib/schema-rules';

export const productImportHeaderSchema = z
  .object({
    storeId: requiredStringSchemaEntry('Select a store.'),
    asOfDate: z.string().date('Select a valid opening balance date.'),
  })
  .superRefine((data, ctx) => {
    if (!data.asOfDate) return;
    const asOfDate = new Date(data.asOfDate);
    const today = new Date();
    asOfDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (asOfDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Opening balance date cannot be in the future.',
        path: ['asOfDate'],
      });
    }
  });

export type ProductImportHeaderValues = z.infer<typeof productImportHeaderSchema>;

export const productImportRowSchema = z.object({
  product_name: z.string().trim().min(1, 'Product name is required.'),
  price: z
    .number()
    .nullable()
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
      message: 'Price must be a non-negative number.',
    }),
  opening_qty: z
    .number()
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: 'Opening quantity must be a non-negative number.',
    }),
});

export type ProductImportRowValues = z.infer<typeof productImportRowSchema>;
