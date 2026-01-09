import { z } from 'zod';

export const jobTrackerSchema = z
  .object({
    id: z.string().optional(),
    dateReceived: z.coerce.date({
      required_error: 'Please select a date and time',
      invalid_type_error: 'Please select a date and time',
    }),
    jobCardNo: z
      .string()
      .min(1, 'Job card no is required')
      .max(5, 'Job card no cannot be over 5 characters'),
    jobDescription: z
      .string()
      .min(1, 'Job description is required')
      .max(255, 'Job description cannot be over 255 characters'),
    jobType: z
      .string()
      .min(1, 'Job type is required')
      .max(50, 'Job type cannot be over 50 characters'),
    startDate: z.coerce.date({
      required_error: 'Please select a date and time',
      invalid_type_error: 'Please select a date and time',
    }),
    endDate: z.coerce
      .date({
        required_error: 'Please select a date and time',
        invalid_type_error: 'Please select a date and time',
      })
      .optional(),
    timeTaken: z.coerce.number().min(1, 'Time taken is required').optional(),
    status: z.enum(['on hold', 'in progress', 'completed']),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (startDate && endDate && startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate'],
      });
    }
  });

export const reportFilterSchema = z
  .object({
    dateRange: z.object({
      from: z.coerce.date({
        required_error: 'Please select a date and time',
        invalid_type_error: 'Please select a date and time',
      }),
      to: z.coerce.date({
        required_error: 'Please select a date and time',
        invalid_type_error: 'Please select a date and time',
      }),
    }),
    status: z.enum(['on hold', 'in progress', 'completed']),
  })
  .superRefine(({ dateRange: { from, to } }, ctx) => {
    if (from && to && from.setHours(0, 0, 0, 0) > to.setHours(0, 0, 0, 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['to'],
      });
    }
  });
