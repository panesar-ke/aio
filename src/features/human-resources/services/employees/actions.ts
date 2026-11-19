'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import db from '@/drizzle/db';
import {
  employees,
  employeesOtherdetails,
  employeeTerminations,
  employeeUsers,
} from '@/drizzle/schema';
import {
  exitEmployeeSchema,
  REINSTATABLE_STATUSES,
  reinstateEmployeeSchema,
} from '@/features/human-resources/utils/employees/schema';
import {
  getNairobiToday,
  validateEffectiveDate,
} from '@/features/human-resources/utils/employees/tenure';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';

const LIST_PATH = '/human-resources/employees';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getEmployeeOrThrow(tx: Tx, id: number) {
  const [employee] = await tx
    .select({
      id: employees.id,
      status: employees.employeeStatus,
      joiningDate: employees.joiningDate,
    })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.isDeleted, false)));

  if (!employee) throw new ActionError('Employee not found.');
  return employee;
}

/** `employees_otherdetails` has no unique key on employee_id, so upsert by hand. */
async function setTerminationDetails(
  tx: Tx,
  employeeId: number,
  details: {
    terminated: boolean;
    terminationDescription: string | null;
    effectiveDate: string | null;
  },
) {
  const updated = await tx
    .update(employeesOtherdetails)
    .set(details)
    .where(eq(employeesOtherdetails.employeeId, employeeId))
    .returning({ employeeId: employeesOtherdetails.employeeId });

  if (updated.length === 0) {
    await tx.insert(employeesOtherdetails).values({ employeeId, ...details });
  }
}

export const exitEmployee = async (values: unknown) =>
  runAction('exit employee', async () => {
    await requireAnyPermission(['hr:admin', 'hr:standard']);
    const data = parseOrFail(exitEmployeeSchema, values);

    await db.transaction(async (tx) => {
      const employee = await getEmployeeOrThrow(tx, data.employeeId);
      if (employee.status !== 'ACTIVE') {
        throw new ActionError('This employee has already exited.');
      }

      const dateError = validateEffectiveDate(
        data.effectiveDate,
        employee.joiningDate,
        getNairobiToday(),
      );
      if (dateError) throw new ActionError(dateError);

      // Guard on ACTIVE so a concurrent exit can't also pass: the loser matches
      // no row and rolls back before writing its termination record.
      const exited = await tx
        .update(employees)
        .set({ employeeStatus: data.status })
        .where(
          and(
            eq(employees.id, data.employeeId),
            eq(employees.employeeStatus, 'ACTIVE'),
          ),
        )
        .returning({ id: employees.id });
      if (exited.length === 0) {
        throw new ActionError('This employee has already exited.');
      }

      await tx.insert(employeeTerminations).values({
        id: crypto.randomUUID(),
        employeeId: data.employeeId,
        terminationDate: data.effectiveDate,
        reason: data.reason,
        remarks: data.remarks || null,
      });

      await setTerminationDetails(tx, data.employeeId, {
        terminated: true,
        terminationDescription: data.reason,
        effectiveDate: data.effectiveDate,
      });

      // Former employees must not keep portal access.
      await tx
        .update(employeeUsers)
        .set({ active: false })
        .where(eq(employeeUsers.employeeRefId, data.employeeId));
    });

    revalidatePath(LIST_PATH);
    return { error: false, message: 'Employee exit recorded.' };
  });

export const reinstateEmployee = async (values: unknown) =>
  runAction('reinstate employee', async () => {
    await requireAnyPermission(['hr:admin', 'hr:standard']);
    const data = parseOrFail(reinstateEmployeeSchema, values);

    await db.transaction(async (tx) => {
      const employee = await getEmployeeOrThrow(tx, data.employeeId);
      if (!(REINSTATABLE_STATUSES as ReadonlyArray<string>).includes(employee.status)) {
        throw new ActionError('Only terminated, resigned or retired employees can be reinstated.');
      }

      // Always validate against the original joining date; a fresh hire only
      // replaces it afterwards.
      const dateError = validateEffectiveDate(
        data.effectiveDate,
        employee.joiningDate,
        getNairobiToday(),
      );
      if (dateError) throw new ActionError(dateError);

      const reinstated = await tx
        .update(employees)
        .set({
          employeeStatus: 'ACTIVE',
          ...(data.resetJoiningDate ? { joiningDate: data.effectiveDate } : {}),
        })
        .where(
          and(
            eq(employees.id, data.employeeId),
            inArray(employees.employeeStatus, [...REINSTATABLE_STATUSES]),
          ),
        )
        .returning({ id: employees.id });
      if (reinstated.length === 0) {
        throw new ActionError('This employee has already been reinstated.');
      }

      await setTerminationDetails(tx, data.employeeId, {
        terminated: false,
        terminationDescription: null,
        effectiveDate: null,
      });
    });

    revalidatePath(LIST_PATH);
    return { error: false, message: 'Employee reinstated.' };
  });

/** Soft delete: other tables (leave, loans, appraisals…) still reference the row. */
export const deleteEmployee = async (employeeId: number) =>
  runAction('delete employee', async () => {
    await requirePermission('hr:admin');

    await db.transaction(async (tx) => {
      await getEmployeeOrThrow(tx, employeeId);

      await tx
        .update(employees)
        .set({ isDeleted: true })
        .where(eq(employees.id, employeeId));

      await tx
        .update(employeeUsers)
        .set({ active: false })
        .where(eq(employeeUsers.employeeRefId, employeeId));
    });

    revalidatePath(LIST_PATH);
    return { error: false, message: 'Employee deleted.' };
  });
