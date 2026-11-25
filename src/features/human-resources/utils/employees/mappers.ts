import {
  type EmployeeFormValues,
  EMPTY_EMPLOYEE_FORM,
  EMPTY_NEXT_OF_KIN,
  MAX_NEXT_OF_KIN,
} from '@/features/human-resources/utils/employees/form-schema';
import { normalizeKenyanPhone } from '@/features/human-resources/utils/employees/phone';

const orNull = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

/** Contract length in whole months, rounded to the nearest month (min 1). */
export function contractMonths(start: string, end: string) {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  const days = ms / 86_400_000;
  return Math.max(1, Math.round(days / 30.4375));
}

/** A next-of-kin number: stored in local format when it is a Kenyan mobile. */
const nokPhone = (value: string) =>
  normalizeKenyanPhone(value) ?? orNull(value);

export type EmployeeFormMapperValues = EmployeeFormValues & {
  qualificationEndDates?: Record<string, string>;
};

/** Database-ready rows for one employee (no ids; the action supplies them). */
export function toDbRecords(
  v: EmployeeFormMapperValues,
  qualificationEndDates = v.qualificationEndDates ?? {},
) {
  const permanent = v.employmentTerms === 'PERMANENT';
  const contractDate = v.contractDate || v.joiningDate;
  const expiryDate = permanent ? null : orNull(v.expiryDate);

  const nok = v.nextOfKin
    .filter((r) => r.name || r.relation || r.phone)
    .slice(0, MAX_NEXT_OF_KIN);

  return {
    employee: {
      surname: v.surname,
      otherNames: v.otherNames,
      gender: v.gender,
      dob: v.dob,
      maritalStatus: v.maritalStatus === '' ? null : v.maritalStatus,
      idNo: orNull(v.idNo),
      payrollNo: orNull(v.payrollNo),
      department: Number(v.department),
      designation: Number(v.designation),
      employmentType: v.employmentTerms,
      contractDate,
      joiningDate: v.joiningDate,
      contractDuration: expiryDate ? contractMonths(contractDate, expiryDate) : 0,
      expiryDate,
      employeeCategory: v.employeeType,
      workfloorType:
        v.employeeType === 'WORKFLOOR' && v.workfloorType !== ''
          ? v.workfloorType
          : null,
      nationality: orNull(v.nationality),
      ethnicity: orNull(v.ethnicity),
      remarks: orNull(v.notes),
    },
    contact: {
      primaryContact: normalizeKenyanPhone(v.phone) ?? v.phone,
      alternativeContact: v.alternativePhone
        ? (normalizeKenyanPhone(v.alternativePhone) ?? v.alternativePhone)
        : null,
      emailAddress: orNull(v.email)?.toLowerCase() ?? null,
      address: orNull(v.postalAddress),
      postalCode: orNull(v.postalCode),
      passport: orNull(v.passport),
    },
    nok: {
      nameOne: orNull(nok[0]?.name),
      relationOne: orNull(nok[0]?.relation),
      contactOne: nok[0] ? nokPhone(nok[0].phone) : null,
      nameTwo: orNull(nok[1]?.name),
      relationTwo: orNull(nok[1]?.relation),
      contactTwo: nok[1] ? nokPhone(nok[1].phone) : null,
    },
    other: {
      kraPin: orNull(v.kraPin),
      nssf: orNull(v.nssf),
      shaNo: orNull(v.shaNo),
      bankName: orNull(v.bankName),
      branchName: orNull(v.branchName),
      accountNo: orNull(v.accountNo),
    },
    children: v.dependants
      .filter((d) => d.name && d.dob)
      .map((d) => ({ childname: d.name, dob: d.dob })),
    qualifications: v.education
      .filter((e) => e.school)
      .map((e) => {
        const storedEndDate = qualificationEndDates[e.id];
        const endDate =
          storedEndDate?.slice(0, 4) === e.year ? storedEndDate : e.year;

        return {
          id: e.id,
          qualificationType: e.type,
          from: orNull(e.from),
          to: orNull(endDate),
          school: e.school,
          attainment: orNull(e.attainment),
          specialization: orNull(e.specialization),
        };
      }),
  };
}

type FormSource = {
  employee: {
    surname: string;
    otherNames: string;
    gender: 'MALE' | 'FEMALE';
    dob: string;
    maritalStatus: EmployeeFormValues['maritalStatus'] | null;
    idNo: string | null;
    payrollNo: string | null;
    department: number;
    designation: number;
    employmentType: EmployeeFormValues['employmentTerms'] | null;
    contractDate: string | null;
    joiningDate: string | null;
    expiryDate: string | null;
    employeeCategory:
      | 'UNIONISABLE'
      | 'MANAGEMENT'
      | 'NON-UNIONISABLE'
      | 'WORKFLOOR'
      | 'CONTRACTOR';
    workfloorType: 'UNIONISABLE' | 'NON-UNIONISABLE' | null;
    nationality: string | null;
    ethnicity: string | null;
    remarks: string | null;
  };
  contact: {
    primaryContact: string | null;
    alternativeContact: string | null;
    emailAddress: string | null;
    address: string | null;
    postalCode: string | null;
    passport: string | null;
  } | null;
  nok: {
    nameOne: string | null;
    relationOne: string | null;
    contactOne: string | null;
    nameTwo: string | null;
    relationTwo: string | null;
    contactTwo: string | null;
  } | null;
  other: {
    kraPin: string | null;
    nssf: string | null;
    shaNo: string | null;
    bankName: string | null;
    branchName: string | null;
    accountNo: string | null;
  } | null;
  children: Array<{ childname: string | null; dob: string | null }>;
  qualifications: Array<{
    id: string;
    qualificationType: 'academic' | 'professional' | 'training';
    from: string | null;
    to: string | null;
    school: string | null;
    attainment: string | null;
    specialization: string | null;
  }>;
};

/** Initial form values for editing, from the stored rows. */
export function toFormValues(src: FormSource): EmployeeFormMapperValues {
  const { employee: e, contact, nok, other } = src;

  // Older records used UNIONISABLE / NON-UNIONISABLE as the category itself.
  const legacyUnion =
    e.employeeCategory === 'UNIONISABLE' || e.employeeCategory === 'NON-UNIONISABLE';
  const employeeType = (
    legacyUnion ? 'WORKFLOOR' : e.employeeCategory
  ) as EmployeeFormValues['employeeType'];
  const workfloorType = (
    legacyUnion
      ? e.employeeCategory
      : e.employeeCategory === 'WORKFLOOR'
        ? (e.workfloorType ?? '')
        : ''
  ) as EmployeeFormValues['workfloorType'];

  const nextOfKin = [
    { name: nok?.nameOne, relation: nok?.relationOne, phone: nok?.contactOne },
    { name: nok?.nameTwo, relation: nok?.relationTwo, phone: nok?.contactTwo },
  ]
    .map((r) => ({
      name: r.name ?? '',
      relation: r.relation ?? '',
      phone: r.phone ?? '',
    }))
    .filter((r) => r.name || r.relation || r.phone);

  return {
    ...EMPTY_EMPLOYEE_FORM,
    surname: e.surname,
    otherNames: e.otherNames,
    gender: e.gender,
    dob: e.dob,
    idNo: e.idNo ?? '',
    passport: contact?.passport ?? '',
    maritalStatus: e.maritalStatus ?? '',
    nationality: e.nationality ?? '',
    ethnicity: e.ethnicity ?? '',
    phone: contact?.primaryContact ?? '',
    alternativePhone: contact?.alternativeContact ?? '',
    email: contact?.emailAddress ?? '',
    postalAddress: contact?.address ?? '',
    postalCode: contact?.postalCode ?? '',
    department: String(e.department),
    designation: String(e.designation),
    payrollNo: e.payrollNo ?? '',
    joiningDate: e.joiningDate ?? '',
    employmentTerms: e.employmentType ?? 'PERMANENT',
    expiryDate: e.expiryDate ?? '',
    contractDate: e.contractDate ?? '',
    employeeType,
    workfloorType,
    kraPin: other?.kraPin ?? '',
    nssf: other?.nssf ?? '',
    shaNo: other?.shaNo ?? '',
    bankName: other?.bankName ?? '',
    branchName: other?.branchName ?? '',
    accountNo: other?.accountNo ?? '',
    nextOfKin: nextOfKin.length ? nextOfKin : [{ ...EMPTY_NEXT_OF_KIN }],
    dependants: src.children.map((c) => ({
      name: c.childname ?? '',
      dob: c.dob ?? '',
    })),
    qualificationEndDates: Object.fromEntries(
      src.qualifications
        .filter((q) => q.id && q.to)
        .map((q) => [q.id, q.to!]),
    ),
    education: src.qualifications.map((q) => ({
      id: q.id,
      type: q.qualificationType,
      from: q.from ?? '',
      school: q.school ?? '',
      attainment: q.attainment ?? '',
      specialization: q.specialization ?? '',
      // Legacy values may be full dates; the form only shows the year.
      year: (q.to ?? '').slice(0, 4),
    })),
    notes: e.remarks ?? '',
  };
}
