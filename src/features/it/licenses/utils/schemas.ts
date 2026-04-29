import { z } from 'zod';

import { LICENSE_STATUS, LICENSE_TYPE } from '@/drizzle/schema';

const licenseSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  totalSeats: z.number().positive({ message: 'Enter a valid value' }),
  usedSeats: z.number().positive({ message: 'Enter a valid value' }),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  renewalDate: z.string().date().optional(),
  renewalCost: z.number().optional(),
  notes: z.string().nullish(),
  licenseKey: z.string().nullish(),
});

export const licenseFormSchemaValues = licenseSchema
  .extend({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    softwareName: z.string().min(1, 'Name is required'),
    status: z.enum(LICENSE_STATUS, {
      required_error: 'Select license status',
      invalid_type_error: 'Invalid license status',
    }),
    licenseType: z.enum(LICENSE_TYPE, {
      required_error: 'Select license type',
      invalid_type_error: 'Invalid license type',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.usedSeats && data.totalSeats) {
      if (data.usedSeats > data.totalSeats) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Used seats must be less than or equal to total seats',
          path: ['usedSeats'],
        });
      }
    }
    if (data.licenseType === 'subscription' && !data.renewalDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Renewal date is required for subscription licenses',
        path: ['renewalDate'],
      });
    }
    if (data.licenseType === 'subscription' && !data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date is required for subscription licenses',
        path: ['startDate'],
      });
    }
    if (data.licenseType === 'subscription' && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required for subscription licenses',
        path: ['endDate'],
      });
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (startDate >= endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date',
          path: ['endDate'],
        });
      }
    }
  });

export const licenseRenewalFormSchema = licenseSchema
  .extend({
    licenseId: z.string().min(1, 'License is required'),
  })
  .superRefine((data, ctx) => {
    if (!data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required',
        path: ['endDate'],
      });
    }
    if (!data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date is required',
        path: ['startDate'],
      });
    }
    if (!data.renewalDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Renewal date is required',
        path: ['renewalDate'],
      });
    }

    if (data.usedSeats && data.totalSeats) {
      if (data.usedSeats > data.totalSeats) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Used seats must be less than or equal to total seats',
          path: ['usedSeats'],
        });
      }
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (startDate >= endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date',
          path: ['endDate'],
        });
      }
    }
  });

export type LicenseFormSchemaValues = z.infer<typeof licenseFormSchemaValues>;
export type LicenseRenewalFormSchemaValues = z.infer<
  typeof licenseRenewalFormSchema
>;
