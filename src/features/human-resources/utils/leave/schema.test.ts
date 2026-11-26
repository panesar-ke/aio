import { describe, expect, it } from 'vitest';

import {
  leaveFormSchema,
  type LeaveFormValues,
} from '@/features/human-resources/utils/leave/schema';

const valid: LeaveFormValues = {
  applicationDate: '2026-11-20',
  employeeCategory: 'MANAGEMENT',
  employeeId: '10',
  leaveTypeId: '1',
  startDate: '2026-11-23',
  endDate: '2026-11-25',
  resumeDate: '2026-11-26',
  halfDay: false,
  reason: 'Family event',
};

function failedFields(over: Partial<LeaveFormValues>) {
  const result = leaveFormSchema.safeParse({ ...valid, ...over });
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
}

describe('leaveFormSchema', () => {
  it('accepts a complete application', () => {
    expect(failedFields({})).toEqual([]);
  });

  it('requires the selections and a reason', () => {
    expect(
      failedFields({
        employeeCategory: '',
        employeeId: '',
        leaveTypeId: '',
        reason: '   ',
      }),
    ).toEqual(['employeeCategory', 'employeeId', 'leaveTypeId', 'reason']);
  });

  it('rejects an end date before the start date', () => {
    expect(failedFields({ endDate: '2026-11-22' })).toEqual(['endDate']);
  });

  it('rejects dates that add up to no leave days', () => {
    expect(
      failedFields({
        startDate: '2026-11-29',
        endDate: '2026-11-29',
        resumeDate: '2026-11-30',
      }),
    ).toEqual(['endDate']);
  });

  it('requires resumption after the end date', () => {
    expect(failedFields({ resumeDate: '2026-11-25' })).toEqual(['resumeDate']);
  });

  it('allows a same-day resumption only for a half day', () => {
    expect(
      failedFields({ resumeDate: '2026-11-25', halfDay: true }),
    ).toEqual([]);
    expect(
      failedFields({ resumeDate: '2026-11-24', halfDay: true }),
    ).toEqual(['resumeDate']);
  });
});
