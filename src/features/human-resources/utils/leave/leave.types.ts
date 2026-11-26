import { format, parse } from 'date-fns';

import type { employeeCategory, leaveStatusEnum } from '@/drizzle/schema';

export type LeaveStatus = (typeof leaveStatusEnum.enumValues)[number];
export type EmployeeCategory = (typeof employeeCategory.enumValues)[number];

export const LEAVE_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELED',
] as const satisfies ReadonlyArray<LeaveStatus>;

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELED: 'Cancelled',
};

export const CATEGORY_LABELS: Record<EmployeeCategory, string> = {
  MANAGEMENT: 'Management',
  WORKFLOOR: 'Workfloor',
  CONTRACTOR: 'Contractor',
  UNIONISABLE: 'Unionisable',
  'NON-UNIONISABLE': 'Non-unionisable',
};

/** The categories HR picks from when raising an application. */
export const LEAVE_FORM_CATEGORIES = [
  'MANAGEMENT',
  'WORKFLOOR',
  'CONTRACTOR',
] as const satisfies ReadonlyArray<EmployeeCategory>;

export type LeaveFormCategory = (typeof LEAVE_FORM_CATEGORIES)[number];

/** Unionisable and non-unionisable staff are workfloor staff for leave. */
export function toLeaveCategory(category: EmployeeCategory): LeaveFormCategory {
  return category === 'UNIONISABLE' || category === 'NON-UNIONISABLE'
    ? 'WORKFLOOR'
    : category;
}

export type LeaveRow = {
  leaveNo: number;
  employeeId: number;
  employeeName: string;
  employeeCategory: EmployeeCategory;
  leaveTypeId: number;
  leaveType: string;
  applicationDate: string;
  startDate: string;
  endDate: string;
  resumeDate: string;
  daysTaken: number;
  status: LeaveStatus;
  reason: string | null;
  isUnpaid: boolean;
  approvedBy: string | null;
};

export type LeaveDecision = 'approve' | 'reject' | 'cancel' | 'delete';

/**
 * What can be done with an application. Only pending leave can change; deciding
 * on it or deleting it is limited to HR admins (`canManage`).
 */
export function getLeaveActions(status: LeaveStatus, canManage: boolean) {
  const pending = status === 'PENDING';
  const decide = pending && canManage;

  return {
    edit: pending,
    print: pending || status === 'APPROVED',
    approve: decide,
    reject: decide,
    cancel: decide,
    delete: decide,
  };
}

export type LeaveFilters = {
  q: string;
  employeeId: number | null;
  leaveTypeId: number | null;
  status: LeaveStatus | null;
};

export function filterLeaves(rows: Array<LeaveRow>, filters: LeaveFilters) {
  const q = filters.q.trim().toLowerCase();

  return rows.filter((r) => {
    if (
      q &&
      !`${r.employeeName} ${r.reason ?? ''}`.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filters.employeeId !== null && r.employeeId !== filters.employeeId) {
      return false;
    }
    if (filters.leaveTypeId !== null && r.leaveTypeId !== filters.leaveTypeId) {
      return false;
    }
    return filters.status === null || r.status === filters.status;
  });
}

/** Page numbers to show, with `null` marking a gap. */
export function getPageItems(page: number, pageCount: number) {
  const pages = [
    ...new Set([1, page - 1, page, page + 1, pageCount]),
  ]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);

  return pages.flatMap<number | null>((p, i) => {
    const gap = p - (pages[i - 1] ?? 0);
    if (gap === 2) return [p - 1, p];
    return gap > 2 ? [null, p] : [p];
  });
}

/** "annual leave" -> "Annual". */
export function formatLeaveType(name: string) {
  return formatPersonName(name.replace(/\s+leave\s*$/i, ''));
}

/** Title case that leaves apostrophes alone, so "NG'ANG'A" -> "Ng'ang'a". */
export function formatPersonName(name: string) {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, lead: string, letter: string) => lead + letter.toUpperCase(),
    );
}

/**
 * Sentence case for display. Reasons are stored as typed, so capitals inside
 * mixed-case text (names, acronyms) are kept; all-caps text is lowered first.
 */
export function formatLeaveReason(reason: string | null) {
  const text = reason?.trim() ?? '';
  const base = text === text.toUpperCase() ? text.toLowerCase() : text;

  return (
    base
      // The first letter, and any letter that opens a sentence or a line.
      .replace(
        /(^|[.!?]\s+|\n\s*)(\p{Ll})/gu,
        (_, lead: string, letter: string) => lead + letter.toUpperCase(),
      )
      // The pronoun "I", including "I'm" and "I'll".
      .replace(/(^|\s)i(?=$|[\s,'’])/g, '$1I')
  );
}

/** yyyy-MM-dd -> "26 Nov 2026". */
export function formatLeaveDate(date: string) {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy');
}
