import { describe, expect, it } from 'vitest';

import { getLeaveBalance } from '@/features/human-resources/utils/leave/balance';
import { type LeaveRow } from '@/features/human-resources/utils/leave/leave.types';

const row = (over: Partial<LeaveRow>): LeaveRow => ({
  leaveNo: 1,
  employeeId: 10,
  employeeName: 'Jane Doe',
  employeeCategory: 'MANAGEMENT',
  leaveTypeId: 1,
  leaveType: 'annual leave',
  applicationDate: '2026-11-01',
  startDate: '2026-11-27',
  endDate: '2026-11-27',
  resumeDate: '2026-11-28',
  daysTaken: 1,
  status: 'APPROVED',
  reason: 'Funeral',
  isUnpaid: false,
  approvedBy: null,
  ...over,
});

const annual = { allocationManagement: 24, allocationWorkshop: 28 };
const current = row({ leaveNo: 100, status: 'PENDING' });

describe('getLeaveBalance', () => {
  it('subtracts leave already taken, then the leave applied for', () => {
    const rows = [current, row({ leaveNo: 1, startDate: '2026-03-02', daysTaken: 2 })];

    expect(getLeaveBalance(current, rows, annual)).toEqual({
      due: 24,
      taken: 2,
      balance: 22,
      applied: 1,
      carriedForward: 21,
    });
  });

  it('counts only earlier approved leave of this type and employee this year', () => {
    const rows = [
      current,
      row({ leaveNo: 1, startDate: '2026-01-01', daysTaken: 1.5 }),
      row({ leaveNo: 2, startDate: '2025-12-31' }),
      row({ leaveNo: 3, startDate: '2026-12-01' }),
      row({ leaveNo: 4, startDate: '2026-02-01', status: 'PENDING' }),
      row({ leaveNo: 5, startDate: '2026-02-01', status: 'REJECTED' }),
      row({ leaveNo: 6, startDate: '2026-02-01', status: 'CANCELED' }),
      row({ leaveNo: 7, startDate: '2026-02-01', leaveTypeId: 2 }),
      row({ leaveNo: 8, startDate: '2026-02-01', employeeId: 11 }),
    ];

    expect(getLeaveBalance(current, rows, annual)?.taken).toBe(1.5);
  });

  it('does not count an approved application against itself', () => {
    const approved = row({});

    expect(getLeaveBalance(approved, [approved], annual)?.taken).toBe(0);
  });

  it.each([
    'WORKFLOOR',
    'UNIONISABLE',
    'NON-UNIONISABLE',
    'CONTRACTOR',
  ] as const)('gives %s staff the workshop allocation', (employeeCategory) => {
    const leave = row({ employeeCategory });

    expect(getLeaveBalance(leave, [leave], annual)?.due).toBe(28);
  });

  it('is empty for a type without an allocation', () => {
    expect(
      getLeaveBalance(current, [current], {
        allocationManagement: 0,
        allocationWorkshop: 0,
      }),
    ).toBeNull();
  });
});
