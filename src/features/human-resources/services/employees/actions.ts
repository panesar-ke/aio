'use server';

import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import db from '@/drizzle/db';
import {
  employeeQualifications,
  employees,
  employeesChildren,
  employeesContacts,
  employeesNoks,
  employeesOtherdetails,
  employeeTerminations,
  employeeUsers,
} from '@/drizzle/schema';
import { generatePassword, hashPassword } from '@/features/admin/utils/helpers';
import { employeeFormSchema } from '@/features/human-resources/utils/employees/form-schema';
import { toDbRecords } from '@/features/human-resources/utils/employees/mappers';
import {
  exitEmployeeSchema,
  REINSTATABLE_STATUSES,
  reinstateEmployeeSchema,
} from '@/features/human-resources/utils/employees/schema';
import {
  getNairobiToday,
  validateEffectiveDate,
} from '@/features/human-resources/utils/employees/tenure';
import { inngest } from '@/inngest/client';
import { sendNewPasswordEvent } from '@/inngest/events';
import { ActionError, parseOrFail, runAction } from '@/lib/actions/safe-action';
import {
  internationalizePhoneNumber,
  titleCase,
} from '@/lib/helpers/formatters';
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

type Records = ReturnType<typeof toDbRecords>;

/** Friendly duplicate checks, run while holding the identifier advisory lock. */
async function assertUnique(tx: Tx, rec: Records, selfId: number) {
  const { idNo, payrollNo } = rec.employee;
  const { primaryContact } = rec.contact;
  const { kraPin } = rec.other;

  const [idTaken, payrollTaken, phoneTaken, portalPhoneTaken, kraTaken] =
    await Promise.all([
      idNo
        ? tx
            .select({ id: employees.id })
            .from(employees)
            .where(and(eq(employees.idNo, idNo), ne(employees.id, selfId)))
            .limit(1)
        : [],
      payrollNo
        ? tx
            .select({ id: employees.id })
            .from(employees)
            .where(
              and(
                eq(employees.payrollNo, payrollNo),
                eq(employees.isDeleted, false),
                ne(employees.id, selfId),
              ),
            )
            .limit(1)
        : [],
      tx
        .select({ id: employeesContacts.employeeId })
        .from(employeesContacts)
        .where(
          and(
            eq(employeesContacts.primaryContact, primaryContact),
            ne(employeesContacts.employeeId, selfId),
          ),
        )
        .limit(1),
      tx
        .select({ id: employeeUsers.id })
        .from(employeeUsers)
        .where(
          and(
            eq(employeeUsers.contact, primaryContact),
            ne(employeeUsers.employeeRefId, selfId),
          ),
        )
        .limit(1),
      kraPin
        ? tx
            .select({ id: employeesOtherdetails.employeeId })
            .from(employeesOtherdetails)
            .where(
              and(
                eq(employeesOtherdetails.kraPin, kraPin),
                ne(employeesOtherdetails.employeeId, selfId),
              ),
            )
            .limit(1)
        : [],
    ]);

  if (idTaken.length) {
    throw new ActionError('ID number already belongs to another employee.');
  }
  if (payrollTaken.length) {
    throw new ActionError('Payroll number is already in use.');
  }
  if (phoneTaken.length || portalPhoneTaken.length) {
    throw new ActionError('Phone number already belongs to another employee.');
  }
  if (kraTaken.length) {
    throw new ActionError('KRA PIN already belongs to another employee.');
  }
}

function isUniqueViolation(error: unknown) {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return (
    code(error) === '23505' ||
    code((error as { cause?: unknown } | null)?.cause) === '23505'
  );
}

/**
 * Creates or updates an employee and everything the form owns (contact, next
 * of kin, statutory details, dependants, education) in one transaction.
 *
 * Columns the form does not show (blood type, allergies, emergency contact,
 * spouse, driving licence, county, NHIF, account name…) are never written on
 * edit, so existing values survive.
 */
export const saveEmployee = async (values: unknown, employeeId?: number) =>
  runAction('save employee', async () => {
    // Editing exposes statutory and bank details, so it is admin-only.
    if (employeeId !== undefined) await requirePermission('hr:admin');
    else await requireAnyPermission(['hr:admin', 'hr:standard']);

    const data = parseOrFail(employeeFormSchema, values);
    const rec = toDbRecords(data);

    let tempPassword: string | null = null;

    let savedId: number;
    try {
      savedId = await db.transaction(async (tx) => {
        // Payroll numbers and KRA PINs have no database unique constraints.
        // Serialize both creates and edits so their check-and-write is atomic.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext('employees.identifiers'))`,
        );

        let id: number;
        if (employeeId !== undefined) {
          const existing = await getEmployeeOrThrow(tx, employeeId);
          if (existing.status !== 'ACTIVE') {
            throw new ActionError('Only active employees can be edited.');
          }
          id = employeeId;

          const storedQualifications = await tx
            .select({
              id: employeeQualifications.id,
              to: employeeQualifications.to,
            })
            .from(employeeQualifications)
            .where(eq(employeeQualifications.employeeId, id));
          rec.qualifications = toDbRecords(
            data,
            Object.fromEntries(
              storedQualifications
                .filter((q) => q.to)
                .map((q) => [q.id, q.to!]),
            ),
          ).qualifications;
        } else {
          // employees.id has no sequence; serialise id allocation.
          await tx.execute(
            sql`select pg_advisory_xact_lock(hashtext('employees.id'))`,
          );
          const [{ next }] = await tx
            .select({
              next: sql<number>`coalesce(max(${employees.id}), 0) + 1`,
            })
            .from(employees);
          id = Number(next);
        }

        await assertUnique(tx, rec, id);

        if (employeeId !== undefined) {
          await tx
            .update(employees)
            .set(rec.employee)
            .where(eq(employees.id, id));
        } else {
          await tx.insert(employees).values({ id, ...rec.employee });
        }

        const contact = await tx
          .update(employeesContacts)
          .set(rec.contact)
          .where(eq(employeesContacts.employeeId, id))
          .returning({ id: employeesContacts.employeeId });
        if (!contact.length) {
          await tx
            .insert(employeesContacts)
            .values({ employeeId: id, ...rec.contact });
        }

        const nok = await tx
          .update(employeesNoks)
          .set(rec.nok)
          .where(eq(employeesNoks.employeeId, id))
          .returning({ id: employeesNoks.employeeId });
        if (!nok.length) {
          await tx.insert(employeesNoks).values({ employeeId: id, ...rec.nok });
        }

        const other = await tx
          .update(employeesOtherdetails)
          .set(rec.other)
          .where(eq(employeesOtherdetails.employeeId, id))
          .returning({ id: employeesOtherdetails.employeeId });
        if (!other.length) {
          await tx
            .insert(employeesOtherdetails)
            .values({ employeeId: id, ...rec.other });
        }

        await tx
          .delete(employeesChildren)
          .where(eq(employeesChildren.employeeId, id));
        if (rec.children.length) {
          await tx
            .insert(employeesChildren)
            .values(rec.children.map((c) => ({ employeeId: id, ...c })));
        }

        await tx
          .delete(employeeQualifications)
          .where(eq(employeeQualifications.employeeId, id));
        if (rec.qualifications.length) {
          await tx.insert(employeeQualifications).values(
            rec.qualifications.map((q) => ({
              ...q,
              id: q.id || crypto.randomUUID(),
              employeeId: id,
            })),
          );
        }

        const portal = {
          name: rec.employee.otherNames,
          contact: rec.contact.primaryContact,
          email: rec.contact.emailAddress,
          employeeType: rec.employee.employeeCategory,
          idNumber: rec.employee.idNo,
        };
        if (employeeId !== undefined) {
          await tx
            .update(employeeUsers)
            .set(portal)
            .where(eq(employeeUsers.employeeRefId, id));
        } else {
          tempPassword = generatePassword();
          await tx.insert(employeeUsers).values({
            ...portal,
            employeeRefId: id,
            password: await hashPassword(tempPassword),
            promptPasswordChange: true,
          });
        }

        return id;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ActionError(
          'ID number, phone number or KRA PIN already belongs to another employee.',
        );
      }
      throw error;
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${savedId}`);

    if (employeeId !== undefined) {
      return {
        error: false,
        message: 'Employee updated.',
        data: { id: savedId },
      };
    }

    // The employee exists at this point, so a failed SMS must not fail the save.
    let smsQueued = true;
    try {
      await inngest.send(
        sendNewPasswordEvent.create({
          contact: internationalizePhoneNumber(rec.contact.primaryContact, true),
          password: tempPassword!,
          name: titleCase(rec.employee.otherNames.split(' ')[0]),
        }),
      );
    } catch (error) {
      smsQueued = false;
      console.error('Failed to queue new employee password SMS:', error);
    }

    return {
      error: false,
      message: smsQueued
        ? 'Employee created. Login details have been sent by SMS.'
        : 'Employee created, but the login SMS could not be sent.',
      data: { id: savedId },
    };
  });
