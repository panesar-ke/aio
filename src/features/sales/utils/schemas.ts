import { endOfDay, isValid, parseISO } from 'date-fns';
import z from 'zod';

import { LEAD_STATUS, SALUTATIONS } from '@/features/sales/utils/constants';
import {
  nullableTrimmedString,
  optionalNumberSchemaEntry,
  requiredNumberSchemaEntry,
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
    (value) => !value || /^[A-P][0-9]{9}[A-Z]$/.test(value.trim()),
    'Invalid KRA PIN format',
  ),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const accountFormSchema = z.object({
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
  title: nullableTrimmedString,
  description: nullableTrimmedString,
  kraPin: nullableTrimmedString.refine(
    (value) => !value || /^[A-P][0-9]{9}[A-Z]$/.test(value.trim()),
    'Invalid KRA PIN format',
  ),
});

export const saleOrderFormSchema = z
  .object({
    id: nullableTrimmedString,
    orderDate: z.iso.date({
      error: (iss) => (iss.input ? 'Invalid Date' : 'Date is required'),
    }),
    accountId: requiredTrimmedStringSchemaEntry('Account is required'),
    vatType: z.enum(['NONE', 'EXCLUSIVE', 'INCLUSIVE'], {
      error: (iss) => (iss.input ? 'Invalid VAT Type' : 'VAT Type is required'),
    }),
    vatRate: optionalNumberSchemaEntry(),
    currency: z.enum(['KES', 'USD'], {
      error: (iss) => (iss.input ? 'Invalid Currency' : 'Currency is required'),
    }),
    exchangeRate: optionalNumberSchemaEntry(),
    details: z
      .array(
        z.object({
          id: requiredTrimmedStringSchemaEntry('Id is required'),
          item: requiredTrimmedStringSchemaEntry('Item is required'),
          qty: requiredNumberSchemaEntry('Quantity is required'),
          rate: requiredNumberSchemaEntry('Rate is required'),
          category: requiredTrimmedStringSchemaEntry('Category is required'),
        }),
      )
      .min(1, { error: 'Order must contain at least one item' }),
  })
  .superRefine(
    ({ vatType, vatRate, orderDate, currency, exchangeRate }, ctx) => {
      if (
        currency === 'USD' &&
        (exchangeRate === undefined || exchangeRate <= 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Exchange rate is required when currency is USD',
          path: ['exchangeRate'],
        });
      }
      if (vatType === 'NONE' && vatRate !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'VAT rate is not required when VAT type is NONE',
          path: ['vatRate'],
        });
      }
      if (vatType !== 'NONE' && vatRate === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'VAT rate is required when VAT type is not NONE',
          path: ['vatRate'],
        });
      }
      if (vatType !== 'NONE' && vatRate && vatRate <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'VAT rate must be greater than 0 when VAT type is not NONE',
          path: ['vatRate'],
        });
      }
      if (vatType !== 'NONE' && vatRate && vatRate > 100) {
        ctx.addIssue({
          code: 'custom',
          message:
            'VAT rate must be less than or equal to 100 when VAT type is not NONE',
          path: ['vatRate'],
        });
      }
      if (vatType !== 'NONE' && vatRate && vatRate % 1 !== 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'VAT rate must be a whole number when VAT type is not NONE',
          path: ['vatRate'],
        });
      }

      if (orderDate) {
        const parsed = parseISO(orderDate);

        if (!isValid(parsed)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid order date',
            path: ['orderDate'],
          });
          return;
        }

        if (endOfDay(parsed) > endOfDay(new Date())) {
          ctx.addIssue({
            code: 'custom',
            message: 'Order date cannot be in the future',
            path: ['orderDate'],
          });
        }
      }
    },
  );

export type AccountFormValues = z.infer<typeof accountFormSchema>;
export type SaleOrderFormValues = z.infer<typeof saleOrderFormSchema>;
