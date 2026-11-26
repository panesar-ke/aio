import { z } from 'zod';

import { isValidIsoDate } from '@/features/human-resources/utils/employees/tenure';
import { countLeaveDays } from '@/features/human-resources/utils/leave/days';

const requiredDate = (message: string) =>
  z.string().min(1, message).refine(isValidIsoDate, 'Select a valid date.');

const selectedId = (message: string) => z.string().regex(/^[1-9]\d*$/, message);

export const leaveFormSchema = z
  .object({
    applicationDate: requiredDate('Application date is required.'),
    employeeCategory: z.string().min(1, 'Select an employee category.'),
    employeeId: selectedId('Select an employee.'),
    leaveTypeId: selectedId('Select a leave type.'),
    startDate: requiredDate('Start date is required.'),
    endDate: requiredDate('End date is required.'),
    resumeDate: requiredDate('Resume date is required.'),
    halfDay: z.boolean(),
    reason: z
      .string()
      .trim()
      .min(1, 'Reason is required.')
      .max(1000, 'Maximum 1000 characters.'),
  })
  .superRefine((v, ctx) => {
    if (!isValidIsoDate(v.startDate) || !isValidIsoDate(v.endDate)) return;

    if (v.endDate < v.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date cannot be before the start date.',
      });
      return;
    }

    if (countLeaveDays(v.startDate, v.endDate, v.halfDay) <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'These dates add up to no leave days.',
      });
    }

    if (!isValidIsoDate(v.resumeDate)) return;

    // A half day can end with the employee back at work the same day.
    const tooEarly = v.halfDay
      ? v.resumeDate < v.endDate
      : v.resumeDate <= v.endDate;
    if (tooEarly) {
      ctx.addIssue({
        code: 'custom',
        path: ['resumeDate'],
        message: v.halfDay
          ? 'Resume date cannot be before the end date.'
          : 'Resume date must be after the end date.',
      });
    }
  });

export type LeaveFormValues = z.input<typeof leaveFormSchema>;
