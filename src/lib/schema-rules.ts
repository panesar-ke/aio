import { z } from 'zod';

export const paymentMethodSchemaEntry = () =>
  z.enum(['cash', 'mpesa', 'cheque', 'bank'], {
    error: (issue) =>
      issue.input === undefined
        ? 'Select payment method'
        : 'Select a payment method',
  });

export const paymentReferenceSchemaEntry = () =>
  z.string().trim().min(1, { message: 'Reference is required' }).toLowerCase();

export const requiredStringSchemaEntry = (message?: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: message || 'This field is required' });

export const requiredTrimmedStringSchemaEntry = (message?: string) =>
  z
    .string()
    .trim()
    .min(1, { message: message || 'This field is required' });

export const nullableTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

export const optionalTrimmedString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value));

export const nullableNonNegativeNumberField = (label: string) =>
  z
    .number({ message: `${label} must be a number` })
    .nullable()
    .refine((value) => !value || (Number.isFinite(value) && value >= 0), {
      message: `${label} must be zero or greater`,
    });

export const optionalStringSchemaEntry = () =>
  z
    .string()
    .optional()
    .transform((val) => val?.trim());

export const optionalNumberSchemaEntry = () =>
  z.coerce.number<number>().optional();

// z.coerce.* runs `Number()`/`new Date()` on the raw input before the schema's
// `error` map ever sees it, so `issue.input` is always the coerced value (NaN /
// Invalid Date) — never `undefined` — even when the field was genuinely missing.
// Checking the raw value inside a `.transform()` (which runs before coercion)
// is the only way to tell "missing" apart from "present but invalid".
export const requiredDateSchemaEntry = () =>
  z.unknown().transform((val, ctx) => {
    if (val === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Date is required' });
      return z.NEVER;
    }
    const date = new Date(val as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Date must be a valid date' });
      return z.NEVER;
    }
    return date;
  });

export const requiredNumberSchemaEntry = (message?: string) =>
  z.coerce
    .number<number>({
      error: (iss) =>
        iss.input ? message || 'Invalid number' : 'Number is required',
    })
    .positive({ error: 'Please enter a valid number' });

//TODO: TO UPDATE AFTER RHF FULL REPLACEMENT
// export const requiredNumberSchemaEntry = (message?: string) =>
//   z
//     .unknown()
//     .transform((val, ctx) => {
//       if (val === undefined) {
//         ctx.addIssue({
//           code: 'custom',
//           message: message || 'Field is required',
//         });
//         return z.NEVER;
//       }
//       const num = Number(val);
//       if (Number.isNaN(num)) {
//         ctx.addIssue({ code: 'custom', message: 'Field must be a number' });
//         return z.NEVER;
//       }
//       return num;
//     })
//     .pipe(
//       z
//         .number()
//         .min(1, { message: message || 'Field is required' })
//         .refine((value) => !Number.isNaN(value) && value > 0, {
//           message: 'This field must be a valid number greater than 0',
//         }),
//     );

export const searchValidateSchema = z.object({ q: z.string().optional() });

export const reportDateRangeSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export const reportDateRangeSchemaWithRequired = z
  .object({
    from: z.string().date('Start date must be a valid date'),
    to: z.string().date('End date must be a valid date'),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) > new Date(data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['from'],
      });
    }
  });

export const reportWithClientAndDateRangeSchema = z.object({
  ...reportDateRangeSchema.shape,
  clientId: z.string().optional(),
});

export const reportWithClientAndDateRangeSchemaWithRequired = z
  .object({
    from: z.string().date('Start date must be a valid date'),
    to: z.string().date('End date must be a valid date'),
    clientId: requiredStringSchemaEntry('Client is required'),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) > new Date(data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['from'],
      });
    }
  });

export const validateReportWithClientAndDateRange = (
  clientId: string | undefined,
  from: string | undefined,
  to: string | undefined,
) => {
  return reportWithClientAndDateRangeSchemaWithRequired.safeParse({
    clientId,
    from,
    to,
  }).success;
};
