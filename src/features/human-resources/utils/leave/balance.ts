import { type LeaveRow } from '@/features/human-resources/utils/leave/leave.types';

export type LeaveTypeAllocation = {
  allocationManagement: number;
  allocationWorkshop: number;
};

export type LeaveBalance = {
  due: number;
  taken: number;
  balance: number;
  applied: number;
  carriedForward: number;
};

/**
 * The balance shown on a printout, for the application's own leave type.
 * "Taken" is approved leave that started earlier in the same calendar year;
 * nothing carries over from previous years. Management has its own allocation
 * and everyone else, contractors included, uses the workshop one. Null when the
 * type has no allocation to count against.
 */
export function getLeaveBalance(
  leave: LeaveRow,
  rows: Array<LeaveRow>,
  allocation: LeaveTypeAllocation,
): LeaveBalance | null {
  const due =
    leave.employeeCategory === 'MANAGEMENT'
      ? allocation.allocationManagement
      : allocation.allocationWorkshop;
  if (due <= 0) return null;

  const yearStart = `${leave.startDate.slice(0, 4)}-01-01`;
  const taken = rows
    .filter(
      (r) =>
        r.leaveNo !== leave.leaveNo &&
        r.employeeId === leave.employeeId &&
        r.leaveTypeId === leave.leaveTypeId &&
        r.status === 'APPROVED' &&
        r.startDate >= yearStart &&
        r.startDate < leave.startDate,
    )
    .reduce((total, r) => total + r.daysTaken, 0);

  const balance = due - taken;

  return {
    due,
    taken,
    balance,
    applied: leave.daysTaken,
    carriedForward: balance - leave.daysTaken,
  };
}
