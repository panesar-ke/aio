import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import db from '@/drizzle/db';
import {
  departments,
  designations,
  employees,
  employeesContacts,
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
