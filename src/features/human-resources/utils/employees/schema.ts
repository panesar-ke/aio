import { z } from 'zod';

import { EXIT_STATUSES } from '@/features/human-resources/utils/employees/employees.types';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date');

export const exitEmployeeSchema = z.object({
  employeeId: z.number().int().positive(),
  status: z.enum(EXIT_STATUSES),
  effectiveDate: isoDate,
  reason: z.string().trim().min(1, 'Reason is required').max(500),
  remarks: z.string().trim().max(1000).optional(),
});

export type ExitEmployeeValues = z.infer<typeof exitEmployeeSchema>;

export const reinstateEmployeeSchema = z.object({
  employeeId: z.number().int().positive(),
  effectiveDate: isoDate,
  /** Treat as a fresh hire: resets the date joined to the effective date. */
  resetJoiningDate: z.boolean(),
});

export type ReinstateEmployeeValues = z.infer<typeof reinstateEmployeeSchema>;

export const EXIT_STATUS_OPTIONS: ReadonlyArray<{
  value: (typeof EXIT_STATUSES)[number];
  label: string;
  reasonLabel: string;
}> = [
  { value: 'TERMINATED', label: 'Terminated', reasonLabel: 'Reason for termination' },
  { value: 'RESIGNED', label: 'Resigned', reasonLabel: 'Reason for resignation' },
  { value: 'RETIRED', label: 'Retired', reasonLabel: 'Retirement details' },
  { value: 'DECEASED', label: 'Deceased', reasonLabel: 'Details' },
];

/** Statuses that can be reversed. Deceased is final. */
export const REINSTATABLE_STATUSES = ['TERMINATED', 'RESIGNED', 'RETIRED'] as const;
