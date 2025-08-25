import { z } from 'zod';

export const paymentMethodSchemaEntry = () =>
  z.enum(['cash', 'mpesa', 'cheque', 'bank'], {
    required_error: 'Select payment method',
    invalid_type_error: 'Select a payment method',
  });

export const paymentReferenceSchemaEntry = () =>
  z.string().trim().min(1, { message: 'Reference is required' }).toLowerCase();

export const requiredStringSchemaEntry = (message?: string) =>
  z
    .string()
    .trim()
    .min(1, { message: message || 'This field is required' }).toLowerCase();

export const optionalStringSchemaEntry = () => z.string().optional().transform(val => val?.trim().toLowerCase());
export const optionalNumberSchemaEntry = () => z.coerce.number().optional();
export const requiredDateSchemaEntry = () =>
  z.coerce.date({
    required_error: 'Date is required',
    invalid_type_error: 'Date must be a valid date',
  });

export const requiredNumberSchemaEntry = (message?: string) =>
  z.coerce
    .number({
      required_error: message || 'Field is required',
      invalid_type_error: 'Field must be a number',
    })
    .min(1, { message: message || 'Field is required' })
    .refine(value => !Number.isNaN(value) && value > 0, {
      message: 'This field must be a valid number greater than 0',
    });

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
  to: string | undefined
) => {
  return reportWithClientAndDateRangeSchemaWithRequired.safeParse({
    clientId,
    from,
    to,
  }).success;
};
