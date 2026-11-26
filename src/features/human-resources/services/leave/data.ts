import 'server-only';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';

import db from '@/drizzle/db';
import {
  employees,
  employeesContacts,
  employeeUsers,
  leaveApplications,
  leaveTypes,
  users,
} from '@/drizzle/schema';
import { type LeaveHistoryRow } from '@/features/human-resources/utils/leave/balance';
import { type LeaveDateRange } from '@/features/human-resources/utils/leave/date-range';
import { wasHalfDay } from '@/features/human-resources/utils/leave/days';
import {
  formatPersonName,
  type LeaveRow,
  toLeaveCategory,
} from '@/features/human-resources/utils/leave/leave.types';
import {
  buildLeaveDecisionSms,
  pickSmsNumber,
} from '@/features/human-resources/utils/leave/notification';
import { type LeaveFormValues } from '@/features/human-resources/utils/leave/schema';

const employeeName = (otherNames: string, surname: string) =>
  formatPersonName(`${otherNames} ${surname}`);

export async function getLeaveTypes() {
  const types = await db
    .select({
      id: leaveTypes.id,
      name: leaveTypes.leaveTypeName,
      allocationManagement: leaveTypes.allocationManagement,
      allocationWorkshop: leaveTypes.allocationWorkshop,
    })
    .from(leaveTypes)
    .orderBy(asc(leaveTypes.id));

  return types.map((t) => ({
    ...t,
    allocationManagement: Number(t.allocationManagement),
    allocationWorkshop: Number(t.allocationWorkshop),
  }));
}

/**
 * Everyone who can be picked in the list filter: all employees, whatever their
 * status or category, plus deleted ones who still have leave on record.
 */
export async function getLeaveFilterEmployees() {
  const withLeave = db
    .select({ id: leaveApplications.employeeId })
    .from(leaveApplications)
    .where(eq(leaveApplications.isDeleted, false));

  const people = await db
    .select({
      id: employees.id,
      otherNames: employees.otherNames,
      surname: employees.surname,
    })
    .from(employees)
    .where(
      or(eq(employees.isDeleted, false), inArray(employees.id, withLeave)),
    )
    .orderBy(asc(employees.otherNames), asc(employees.surname));

  return people.map((p) => ({
    id: p.id,
    name: employeeName(p.otherNames, p.surname),
  }));
}

/** Applications with at least one day of leave inside the range. */
export async function getLeaveApplications({
  from,
  to,
}: LeaveDateRange): Promise<Array<LeaveRow>> {
  const records = await db
    .select({
      leaveNo: leaveApplications.leaveNo,
      employeeId: leaveApplications.employeeId,
      otherNames: employees.otherNames,
      surname: employees.surname,
      employeeCategory: leaveApplications.employeeCategory,
      leaveTypeId: leaveApplications.leaveTypeId,
      leaveType: leaveTypes.leaveTypeName,
      applicationDate: leaveApplications.applicationDate,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      resumeDate: leaveApplications.resumeDate,
      daysTaken: leaveApplications.daysTaken,
      status: leaveApplications.leaveStatus,
      reason: leaveApplications.reason,
      isUnpaid: leaveApplications.isUnpaid,
      approvedBy: users.name,
    })
    .from(leaveApplications)
    .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
    .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
    .leftJoin(users, eq(leaveApplications.approvedBy, users.id))
    .where(
      and(
        eq(leaveApplications.isDeleted, false),
        lte(leaveApplications.startDate, to),
        gte(leaveApplications.endDate, from),
      ),
    )
    .orderBy(
      desc(leaveApplications.applicationDate),
      desc(leaveApplications.leaveNo),
    );

  return records.map(({ otherNames, surname, ...r }) => ({
    ...r,
    employeeName: employeeName(otherNames, surname),
    daysTaken: Number(r.daysTaken),
    isUnpaid: r.isUnpaid ?? false,
    approvedBy: r.approvedBy ? formatPersonName(r.approvedBy) : null,
  }));
}

/**
 * The approved leave needed to work out the balance on a printout of any of
 * `rows`. It reaches back to 1 January, which may be before the listed range.
 */
export async function getLeaveBalanceHistory(
  rows: Array<LeaveRow>,
): Promise<Array<LeaveHistoryRow>> {
  if (rows.length === 0) return [];
  const startDates = rows.map((r) => r.startDate).sort();

  const records = await db
    .select({
      leaveNo: leaveApplications.leaveNo,
      employeeId: leaveApplications.employeeId,
      leaveTypeId: leaveApplications.leaveTypeId,
      status: leaveApplications.leaveStatus,
      startDate: leaveApplications.startDate,
      daysTaken: leaveApplications.daysTaken,
    })
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.isDeleted, false),
        eq(leaveApplications.leaveStatus, 'APPROVED'),
        inArray(leaveApplications.employeeId, [
          ...new Set(rows.map((r) => r.employeeId)),
        ]),
        gte(leaveApplications.startDate, `${startDates[0].slice(0, 4)}-01-01`),
        lt(leaveApplications.startDate, startDates[startDates.length - 1]),
      ),
    );

  return records.map((r) => ({ ...r, daysTaken: Number(r.daysTaken) }));
}

/**
 * Options for the application form. `currentEmployeeId` keeps the employee of
 * the record being edited selectable even if they would not be offered today.
 */
export async function getLeaveFormOptions(currentEmployeeId?: number) {
  const eligible = and(
    eq(employees.isDeleted, false),
    eq(employees.employeeStatus, 'ACTIVE'),
  );

  const [people, types] = await Promise.all([
    db
      .select({
        id: employees.id,
        otherNames: employees.otherNames,
        surname: employees.surname,
        category: employees.employeeCategory,
      })
      .from(employees)
      .where(
        currentEmployeeId === undefined
          ? eligible
          : or(eligible, eq(employees.id, currentEmployeeId)),
      )
      .orderBy(asc(employees.otherNames), asc(employees.surname)),
    getLeaveTypes(),
  ]);

  return {
    employees: people.map((p) => ({
      id: p.id,
      name: employeeName(p.otherNames, p.surname),
      category: toLeaveCategory(p.category),
    })),
    leaveTypes: types,
  };
}

/**
 * The text telling an employee their leave was approved or rejected, with the
 * number to send it to. Null if the leave has no such decision to report; `to`
 * is null if the employee has no usable mobile number.
 */
export async function getLeaveDecisionSms(leaveNo: number) {
  const [leave] = await db
    .select({
      employeeId: leaveApplications.employeeId,
      otherNames: employees.otherNames,
      leaveType: leaveTypes.leaveTypeName,
      status: leaveApplications.leaveStatus,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      resumeDate: leaveApplications.resumeDate,
      daysTaken: leaveApplications.daysTaken,
    })
    .from(leaveApplications)
    .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
    .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
    .where(
      and(
        eq(leaveApplications.leaveNo, leaveNo),
        eq(leaveApplications.isDeleted, false),
      ),
    );

  if (!leave) return null;
  const { employeeId, status, daysTaken, ...details } = leave;
  if (status !== 'APPROVED' && status !== 'REJECTED') return null;

  // Staff without portal access only have a number on their contact record.
  const [contacts, portalUsers] = await Promise.all([
    db
      .select({
        primary: employeesContacts.primaryContact,
        alternative: employeesContacts.alternativeContact,
      })
      .from(employeesContacts)
      .where(eq(employeesContacts.employeeId, employeeId)),
    db
      .select({ contact: employeeUsers.contact })
      .from(employeeUsers)
      .where(eq(employeeUsers.employeeRefId, employeeId)),
  ]);

  return {
    to: pickSmsNumber([
      ...contacts.map((c) => c.primary),
      ...portalUsers.map((u) => u.contact),
      ...contacts.map((c) => c.alternative),
    ]),
    message: buildLeaveDecisionSms({
      ...details,
      leaveNo,
      status,
      daysTaken: Number(daysTaken),
    }),
  };
}

/** A preview only: the number is assigned again when the record is saved. */
export async function getNextLeaveNo() {
  const [{ next }] = await db
    .select({
      next: sql<number>`coalesce(max(${leaveApplications.leaveNo}), 0) + 1`,
    })
    .from(leaveApplications);

  return Number(next);
}

export async function getLeaveForEdit(leaveNo: number) {
  const [record] = await db
    .select()
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.leaveNo, leaveNo),
        eq(leaveApplications.isDeleted, false),
      ),
    );

  if (!record) return null;

  const values: LeaveFormValues = {
    applicationDate: record.applicationDate,
    employeeCategory: toLeaveCategory(record.employeeCategory),
    employeeId: String(record.employeeId),
    leaveTypeId: String(record.leaveTypeId),
    startDate: record.startDate,
    endDate: record.endDate,
    resumeDate: record.resumeDate,
    halfDay: wasHalfDay(
      record.startDate,
      record.endDate,
      Number(record.daysTaken),
    ),
    reason: record.reason ?? '',
  };

  return {
    status: record.leaveStatus,
    employeeId: record.employeeId,
    employeeCategory: toLeaveCategory(record.employeeCategory),
    values,
  };
}
