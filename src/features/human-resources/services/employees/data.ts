import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import type { Option } from '@/types/index.types';

import db from '@/drizzle/db';
import {
  departments,
  designations,
  employeeQualifications,
  employees,
  employeesChildren,
  employeesContacts,
  employeesNoks,
  employeesOtherdetails,
  employeeTerminations,
  leaveApplications,
} from '@/drizzle/schema';
import {
  deriveDisplayStatus,
  type EmployeeRow,
  type EmployeeStats,
  isExited,
} from '@/features/human-resources/utils/employees/employees.types';
import { toFormValues } from '@/features/human-resources/utils/employees/mappers';
import {
  formatTenure,
  getNairobiToday,
} from '@/features/human-resources/utils/employees/tenure';

/** Ids of employees with approved leave covering `today` (optionally just one). */
async function getOnLeaveIds(today: string, employeeId?: number) {
  const rows = await db
    .selectDistinct({ employeeId: leaveApplications.employeeId })
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.isDeleted, false),
        eq(leaveApplications.leaveStatus, 'APPROVED'),
        lte(leaveApplications.startDate, today),
        gte(leaveApplications.endDate, today),
        employeeId === undefined
          ? undefined
          : eq(leaveApplications.employeeId, employeeId),
      ),
    );
  return new Set(rows.map((r) => r.employeeId));
}

/**
 * `employees_otherdetails` and `employees_contacts` have no unique key on
 * employee_id, so joining them directly can duplicate an employee. These
 * subqueries collapse each to one row per employee.
 */
const otherDetailsOnePerEmployee = () =>
  db
    .selectDistinctOn([employeesOtherdetails.employeeId])
    .from(employeesOtherdetails)
    .orderBy(employeesOtherdetails.employeeId)
    .as('od');

const contactsOnePerEmployee = () =>
  db
    .selectDistinctOn([employeesContacts.employeeId])
    .from(employeesContacts)
    .orderBy(employeesContacts.employeeId)
    .as('ec');

export async function getEmployees(): Promise<{
  rows: Array<EmployeeRow>;
  stats: EmployeeStats;
}> {
  const today = getNairobiToday();

  const [people, onLeaveIds] = await Promise.all([
    db
      .select({
        id: employees.id,
        surname: employees.surname,
        otherNames: employees.otherNames,
        payrollNo: employees.payrollNo,
        department: departments.departmentName,
        designation: designations.designationName,
        employmentType: employees.employmentType,
        joiningDate: employees.joiningDate,
        status: employees.employeeStatus,
      })
      .from(employees)
      .innerJoin(departments, eq(employees.department, departments.id))
      .innerJoin(designations, eq(employees.designation, designations.id))
      .where(eq(employees.isDeleted, false))
      .orderBy(asc(employees.otherNames), asc(employees.surname)),
    getOnLeaveIds(today),
  ]);

  const rows = people.map<EmployeeRow>((p) => ({
    id: p.id,
    name: `${p.otherNames} ${p.surname}`.replace(/\s+/g, ' ').trim(),
    payrollNo: p.payrollNo,
    department: p.department,
    designation: p.designation,
    employmentType: p.employmentType,
    joiningDate: p.joiningDate,
    tenure: p.joiningDate ? formatTenure(p.joiningDate, today) : null,
    status: deriveDisplayStatus(p.status, onLeaveIds.has(p.id)),
  }));

  const current = rows.filter((r) => !isExited(r.status));

  return {
    rows,
    stats: {
      total: current.length,
      active: rows.filter((r) => r.status === 'ACTIVE').length,
      onLeave: rows.filter((r) => r.status === 'ON_LEAVE').length,
      onContract: current.filter((r) => r.employmentType === 'CONTRACT').length,
    },
  };
}

/** Full records for an export, limited to the given employee ids. */
export async function getEmployeesForExport(ids: Array<number>) {
  if (ids.length === 0) return [];

  const [records, onLeaveIds] = await Promise.all([
    exportQuery(ids),
    getOnLeaveIds(getNairobiToday()),
  ]);

  // Same derivation as the list, so exports match what users see.
  return records.map(({ dbStatus, ...r }) => ({
    ...r,
    status: deriveDisplayStatus(dbStatus, onLeaveIds.has(r.id)),
  }));
}

function exportQuery(ids: Array<number>) {
  const od = otherDetailsOnePerEmployee();

  return db
    .select({
      id: employees.id,
      surname: employees.surname,
      otherNames: employees.otherNames,
      payrollNo: employees.payrollNo,
      gender: employees.gender,
      maritalStatus: employees.maritalStatus,
      nationality: employees.nationality,
      idNo: employees.idNo,
      dob: employees.dob,
      department: departments.departmentName,
      designation: designations.designationName,
      employmentType: employees.employmentType,
      category: employees.employeeCategory,
      dbStatus: employees.employeeStatus,
      joiningDate: employees.joiningDate,
      contractDate: employees.contractDate,
      contractDuration: employees.contractDuration,
      expiryDate: employees.expiryDate,
      educationLevel: od.educationLevel,
      kraPin: od.kraPin,
      nssf: od.nssf,
      shaNo: od.shaNo,
      nhif: od.nhif,
      bankName: od.bankName,
      branchName: od.branchName,
      accountNo: od.accountNo,
      accountName: od.accountName,
    })
    .from(employees)
    .innerJoin(departments, eq(employees.department, departments.id))
    .innerJoin(designations, eq(employees.designation, designations.id))
    .leftJoin(od, eq(od.employeeId, employees.id))
    .where(and(eq(employees.isDeleted, false), inArray(employees.id, ids)))
    .orderBy(asc(employees.otherNames), asc(employees.surname));
}

/** A single employee's full record. Sensitive fields are only selected when allowed. */
export async function getEmployeeDetails(
  id: number,
  includeSensitive: boolean,
) {
  const today = getNairobiToday();
  const od = otherDetailsOnePerEmployee();
  const ec = contactsOnePerEmployee();

  const [[employee], onLeaveIds] = await Promise.all([
    db
      .select({
        id: employees.id,
        surname: employees.surname,
        otherNames: employees.otherNames,
        payrollNo: employees.payrollNo,
        gender: employees.gender,
        maritalStatus: employees.maritalStatus,
        nationality: employees.nationality,
        ethnicity: employees.ethnicity,
        department: departments.departmentName,
        designation: designations.designationName,
        employmentType: employees.employmentType,
        category: employees.employeeCategory,
        dbStatus: employees.employeeStatus,
        joiningDate: employees.joiningDate,
        contractDate: employees.contractDate,
        contractDuration: employees.contractDuration,
        expiryDate: employees.expiryDate,
        remarks: employees.remarks,
        educationLevel: od.educationLevel,
        ...(includeSensitive
          ? {
              idNo: employees.idNo,
              dob: employees.dob,
              kraPin: od.kraPin,
              nssf: od.nssf,
              shaNo: od.shaNo,
              bankName: od.bankName,
              branchName: od.branchName,
              accountNo: od.accountNo,
              accountName: od.accountName,
              phone: ec.primaryContact,
              email: ec.emailAddress,
            }
          : {}),
      })
      .from(employees)
      .innerJoin(departments, eq(employees.department, departments.id))
      .innerJoin(designations, eq(employees.designation, designations.id))
      .leftJoin(od, eq(od.employeeId, employees.id))
      .leftJoin(ec, eq(ec.employeeId, employees.id))
      .where(and(eq(employees.id, id), eq(employees.isDeleted, false)))
      .limit(1),
    getOnLeaveIds(today, id),
  ]);

  if (!employee) return null;

  const [lastExit] = await db
    .select({
      date: employeeTerminations.terminationDate,
      reason: employeeTerminations.reason,
      remarks: employeeTerminations.remarks,
    })
    .from(employeeTerminations)
    .where(eq(employeeTerminations.employeeId, id))
    .orderBy(desc(employeeTerminations.terminationDate))
    .limit(1);

  return {
    ...employee,
    // Same derivation as the list, so the status never differs between pages.
    status: deriveDisplayStatus(employee.dbStatus, onLeaveIds.has(id)),
    lastExit: lastExit ?? null,
  };
}

/** Departments and designations for the employee form. */
export async function getEmployeeFormOptions(currentDesignationId?: number) {
  const [depts, desigs] = await Promise.all([
    db
      .select({ id: departments.id, name: departments.departmentName })
      .from(departments)
      .orderBy(asc(departments.departmentName)),
    db
      .select({
        id: designations.id,
        name: designations.designationName,
        active: designations.active,
      })
      .from(designations)
      .orderBy(asc(designations.designationName)),
  ]);

  return {
    departments: depts.map<Option>((d) => ({ value: String(d.id), label: d.name })),
    // Inactive designations are hidden, except the one an employee already holds.
    designations: desigs
      .filter((d) => d.active || d.id === currentDesignationId)
      .map<Option>((d) => ({ value: String(d.id), label: d.name })),
  };
}

/** Everything the form needs to edit one employee, or null if not found. */
export async function getEmployeeForEdit(id: number) {
  const [employee] = await db
    .select({
      surname: employees.surname,
      otherNames: employees.otherNames,
      gender: employees.gender,
      dob: employees.dob,
      maritalStatus: employees.maritalStatus,
      idNo: employees.idNo,
      payrollNo: employees.payrollNo,
      department: employees.department,
      designation: employees.designation,
      employmentType: employees.employmentType,
      contractDate: employees.contractDate,
      joiningDate: employees.joiningDate,
      expiryDate: employees.expiryDate,
      employeeCategory: employees.employeeCategory,
      workfloorType: employees.workfloorType,
      nationality: employees.nationality,
      ethnicity: employees.ethnicity,
      remarks: employees.remarks,
      status: employees.employeeStatus,
    })
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.isDeleted, false)))
    .limit(1);

  if (!employee) return null;

  const [[contact], [nok], [other], children, qualifications] = await Promise.all([
    db.select().from(employeesContacts).where(eq(employeesContacts.employeeId, id)).limit(1),
    db.select().from(employeesNoks).where(eq(employeesNoks.employeeId, id)).limit(1),
    db.select().from(employeesOtherdetails).where(eq(employeesOtherdetails.employeeId, id)).limit(1),
    db.select().from(employeesChildren).where(eq(employeesChildren.employeeId, id)),
    db.select().from(employeeQualifications).where(eq(employeeQualifications.employeeId, id)),
  ]);

  const { status, ...rest } = employee;

  return {
    status,
    values: toFormValues({
      employee: rest,
      contact: contact ?? null,
      nok: nok ?? null,
      other: other ?? null,
      children,
      qualifications,
    }),
  };
}
