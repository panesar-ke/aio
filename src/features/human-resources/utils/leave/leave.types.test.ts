import { describe, expect, it } from 'vitest';

import {
  filterLeaves,
  formatLeaveReason,
  formatLeaveType,
  formatPersonName,
  getLeaveActions,
  getPageItems,
  type LeaveRow,
  toLeaveCategory,
} from '@/features/human-resources/utils/leave/leave.types';

describe('toLeaveCategory', () => {
  it.each(['UNIONISABLE', 'NON-UNIONISABLE', 'WORKFLOOR'] as const)(
    'treats %s staff as workfloor',
    (category) => {
      expect(toLeaveCategory(category)).toBe('WORKFLOOR');
    },
  );

  it.each(['MANAGEMENT', 'CONTRACTOR'] as const)('keeps %s', (category) => {
    expect(toLeaveCategory(category)).toBe(category);
  });
});

describe('getLeaveActions', () => {
  it('lets an HR admin do everything with pending leave', () => {
    expect(getLeaveActions('PENDING', true)).toEqual({
      edit: true,
      print: true,
      approve: true,
      reject: true,
      cancel: true,
      delete: true,
    });
  });

  it('limits other HR users to editing and printing pending leave', () => {
    expect(getLeaveActions('PENDING', false)).toEqual({
      edit: true,
      print: true,
      approve: false,
      reject: false,
      cancel: false,
      delete: false,
    });
  });

  it('only prints approved leave', () => {
    expect(getLeaveActions('APPROVED', true)).toEqual({
      edit: false,
      print: true,
      approve: false,
      reject: false,
      cancel: false,
      delete: false,
    });
  });

  it.each(['REJECTED', 'CANCELED'] as const)(
    'allows nothing on %s leave',
    (status) => {
      expect(Object.values(getLeaveActions(status, true))).not.toContain(true);
    },
  );
});

const row = (over: Partial<LeaveRow>): LeaveRow => ({
  leaveNo: 1,
  employeeId: 10,
  employeeName: 'Jane Doe',
  employeeCategory: 'MANAGEMENT',
  leaveTypeId: 1,
  leaveType: 'annual leave',
  applicationDate: '2026-11-01',
  startDate: '2026-11-23',
  endDate: '2026-11-23',
  resumeDate: '2026-11-24',
  daysTaken: 1,
  status: 'PENDING',
  reason: 'Family event',
  isUnpaid: false,
  approvedBy: null,
  ...over,
});

describe('filterLeaves', () => {
  const rows = [
    row({}),
    row({
      leaveNo: 2,
      employeeId: 11,
      employeeName: 'John Roe',
      leaveTypeId: 2,
      status: 'APPROVED',
      reason: null,
    }),
  ];
  const none = { q: '', employeeId: null, leaveTypeId: null, status: null };
  const ids = (filters: Partial<Parameters<typeof filterLeaves>[1]>) =>
    filterLeaves(rows, { ...none, ...filters }).map((r) => r.leaveNo);

  it('returns everything without filters', () => {
    expect(ids({})).toEqual([1, 2]);
  });

  it('searches names and reasons, ignoring case', () => {
    expect(ids({ q: 'JOHN' })).toEqual([2]);
    expect(ids({ q: 'family' })).toEqual([1]);
  });

  it('combines staff, type and status filters', () => {
    expect(ids({ employeeId: 11 })).toEqual([2]);
    expect(ids({ leaveTypeId: 1 })).toEqual([1]);
    expect(ids({ status: 'APPROVED' })).toEqual([2]);
    expect(ids({ leaveTypeId: 1, status: 'APPROVED' })).toEqual([]);
  });
});

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('marks gaps', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, null, 20]);
    expect(getPageItems(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('fills a single missing page instead of showing a gap', () => {
    expect(getPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, null, 20]);
  });
});

describe('formatting', () => {
  it('shortens leave type names', () => {
    expect(formatLeaveType('annual leave')).toBe('Annual');
    expect(formatLeaveType('maternity')).toBe('Maternity');
  });

  it('writes reasons in sentence case', () => {
    expect(formatLeaveReason('attending a church conference')).toBe(
      'Attending a church conference',
    );
    expect(formatLeaveReason('TAKE DAD FOR SCAN REVIEWS.')).toBe(
      'Take dad for scan reviews.',
    );
    expect(formatLeaveReason('flu. doctor says i need rest, i’m unwell')).toBe(
      'Flu. Doctor says I need rest, I’m unwell',
    );
  });

  it('keeps capitals in mixed-case reasons', () => {
    expect(formatLeaveReason('travel to Nairobi for KCSE results')).toBe(
      'Travel to Nairobi for KCSE results',
    );
  });

  it('handles a missing reason', () => {
    expect(formatLeaveReason(null)).toBe('');
    expect(formatLeaveReason('   ')).toBe('');
  });

  it('title cases names without breaking apostrophes', () => {
    expect(formatPersonName("  MARY  NG'ANG'A-OTIENO ")).toBe(
      "Mary Ng'ang'a-Otieno",
    );
  });
});
