'use server';

import { and, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import db from '@/drizzle/db';
import { employees, leaveApplications, leaveTypes } from '@/drizzle/schema';
import { countLeaveDays } from '@/features/human-resources/utils/leave/days';
import {
  type EmployeeCategory,
  formatLeaveDate,
  type LeaveStatus,
  toLeaveCategory,
} from '@/features/human-resources/utils/leave/leave.types';
import { leaveFormSchema } from '@/features/human-resources/utils/leave/schema';
import { inngest } from '@/inngest/client';
import { leaveDecidedEvent } from '@/inngest/events';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';

const LIST_PATH = '/human-resources/leave-management';
const NO_LONGER_PENDING =
  'This leave application is no longer pending. Refresh and try again.';

const leaveNoSchema = z.number().int().positive();

/** A pending, undeleted application: the only kind that can still change. */
const pendingLeave = (leaveNo: number) =>
  and(
    eq(leaveApplications.leaveNo, leaveNo),
    eq(leaveApplications.isDeleted, false),
    eq(leaveApplications.leaveStatus, 'PENDING'),
  );

export const saveLeaveApplication = async (
  values: unknown,
  leaveNo?: number,
) =>
  runAction('save leave application', async () => {
    await requireAnyPermission(['hr:admin', 'hr:standard']);
    const data = parseOrFail(leaveFormSchema, values);
    const editing =
      leaveNo === undefined ? null : parseOrFail(leaveNoSchema, leaveNo);
    const employeeId = Number(data.employeeId);
    const leaveTypeId = Number(data.leaveTypeId);

    const savedNo = await db.transaction(async (tx) => {
      // `leave_no` has no sequence and overlaps have no constraint, so writes
      // are serialised to keep both check-and-write steps atomic.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('leave_applications.write'))`,
      );

      let existing:
        | { employeeId: number; category: EmployeeCategory }
        | undefined;
      if (editing !== null) {
        [existing] = await tx
          .select({
            employeeId: leaveApplications.employeeId,
            category: leaveApplications.employeeCategory,
          })
          .from(leaveApplications)
          .where(pendingLeave(editing));
        if (!existing) throw new ActionError(NO_LONGER_PENDING);
      }

      const [employee] = await tx
        .select({
          category: employees.employeeCategory,
          status: employees.employeeStatus,
          isDeleted: employees.isDeleted,
        })
        .from(employees)
        .where(eq(employees.id, employeeId));
      if (!employee) throw new ActionError('Employee not found.');

      // An edit that keeps the same employee keeps the recorded category as
      // stored, even if the employee has since moved or left.
      const unchanged =
        existing?.employeeId === employeeId &&
        toLeaveCategory(existing.category) === data.employeeCategory;
      let category: EmployeeCategory;

      if (unchanged) {
        category = existing!.category;
      } else {
        if (employee.isDeleted || employee.status !== 'ACTIVE') {
          throw new ActionError('Only active employees can be given leave.');
        }
        category = toLeaveCategory(employee.category);
        if (category !== data.employeeCategory) {
          throw new ActionError(
            'The employee does not belong to the selected category.',
          );
        }
      }

      const [leaveType] = await tx
        .select({ isPaid: leaveTypes.isPaidLeave })
        .from(leaveTypes)
        .where(eq(leaveTypes.id, leaveTypeId));
      if (!leaveType) throw new ActionError('Leave type not found.');

      const [clash] = await tx
        .select({
          leaveNo: leaveApplications.leaveNo,
          startDate: leaveApplications.startDate,
          endDate: leaveApplications.endDate,
        })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.employeeId, employeeId),
            eq(leaveApplications.isDeleted, false),
            inArray(leaveApplications.leaveStatus, ['PENDING', 'APPROVED']),
            lte(leaveApplications.startDate, data.endDate),
            gte(leaveApplications.endDate, data.startDate),
            editing === null
              ? undefined
              : ne(leaveApplications.leaveNo, editing),
          ),
        )
        .limit(1);
      if (clash) {
        throw new ActionError(
          `These dates overlap leave #${clash.leaveNo} (${formatLeaveDate(clash.startDate)} to ${formatLeaveDate(clash.endDate)}).`,
        );
      }

      const record = {
        employeeId,
        employeeCategory: category,
        leaveTypeId,
        applicationDate: data.applicationDate,
        startDate: data.startDate,
        endDate: data.endDate,
        resumeDate: data.resumeDate,
        daysTaken: String(
          countLeaveDays(data.startDate, data.endDate, data.halfDay),
        ),
        reason: data.reason,
        isUnpaid: !leaveType.isPaid,
      };

      if (editing !== null) {
        // Approval does not take the lock above, so guard the status again.
        const updated = await tx
          .update(leaveApplications)
          .set(record)
          .where(pendingLeave(editing))
          .returning({ leaveNo: leaveApplications.leaveNo });
        if (!updated.length) throw new ActionError(NO_LONGER_PENDING);
        return editing;
      }

      const [{ next }] = await tx
        .select({
          next: sql<number>`coalesce(max(${leaveApplications.leaveNo}), 0) + 1`,
        })
        .from(leaveApplications);
      await tx
        .insert(leaveApplications)
        .values({ leaveNo: Number(next), ...record });
      return Number(next);
    });

    revalidatePath(LIST_PATH);
    return {
      error: false,
      message: `Leave application #${savedNo} ${editing === null ? 'saved' : 'updated'}.`,
    };
  });

async function decideLeave(
  leaveNo: number,
  status: Exclude<LeaveStatus, 'PENDING'>,
  approvedBy?: string,
) {
  const id = parseOrFail(leaveNoSchema, leaveNo);
  const updated = await db
    .update(leaveApplications)
    .set({ leaveStatus: status, ...(approvedBy ? { approvedBy } : {}) })
    .where(pendingLeave(id))
    .returning({ leaveNo: leaveApplications.leaveNo });
  if (!updated.length) throw new ActionError(NO_LONGER_PENDING);

  revalidatePath(LIST_PATH);
}

/**
 * Queues the SMS to the employee. The decision is already saved, so a failure
 * here is reported in the message rather than failing the action.
 */
async function notifyEmployee(leaveNo: number) {
  try {
    await inngest.send(leaveDecidedEvent.create({ leaveNo }));
    return 'SMS notification queued.';
  } catch (error) {
    console.error(`Failed to queue the SMS for leave ${leaveNo}:`, error);
    return 'The SMS to the employee could not be queued.';
  }
}

export const approveLeave = async (leaveNo: number) =>
  runAction('approve leave', async () => {
    await requirePermission('hr:admin');
    const user = await getCurrentUser('action');
    await decideLeave(leaveNo, 'APPROVED', user.id);
    const sms = await notifyEmployee(leaveNo);
    return { error: false, message: `Leave approved. ${sms}` };
  });

export const rejectLeave = async (leaveNo: number) =>
  runAction('reject leave', async () => {
    await requirePermission('hr:admin');
    await decideLeave(leaveNo, 'REJECTED');
    const sms = await notifyEmployee(leaveNo);
    return { error: false, message: `Leave rejected. ${sms}` };
  });

export const cancelLeave = async (leaveNo: number) =>
  runAction('cancel leave', async () => {
    await requirePermission('hr:admin');
    await decideLeave(leaveNo, 'CANCELED');
    return { error: false, message: 'Leave cancelled.' };
  });

/** Soft delete, limited to pending applications. */
export const deleteLeaveApplication = async (leaveNo: number) =>
  runAction('delete leave application', async () => {
    await requirePermission('hr:admin');
    const id = parseOrFail(leaveNoSchema, leaveNo);

    const deleted = await db
      .update(leaveApplications)
      .set({ isDeleted: true })
      .where(pendingLeave(id))
      .returning({ leaveNo: leaveApplications.leaveNo });
    if (!deleted.length) throw new ActionError(NO_LONGER_PENDING);

    revalidatePath(LIST_PATH);
    return { error: false, message: 'Leave application deleted.' };
  });
