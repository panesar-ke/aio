import { z } from 'zod';

import {
  isPlausiblePhone,
  isValidKenyanPhone,
} from '@/features/human-resources/utils/employees/phone';
import {
  getNairobiToday,
  isValidIsoDate,
} from '@/features/human-resources/utils/employees/tenure';

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const;

export const MARITAL_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
] as const;

export const EMPLOYEE_TYPES = [
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'WORKFLOOR', label: 'Workfloor' },
  { value: 'CONTRACTOR', label: 'Contractor' },
] as const;

export const WORKFLOOR_TYPES = [
  { value: 'UNIONISABLE', label: 'Union Member' },
  { value: 'NON-UNIONISABLE', label: 'Non Union Member' },
] as const;

export const EMPLOYMENT_TERMS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'INTERN', label: 'Intern' },
  { value: 'NO CONTRACT', label: 'No contract' },
] as const;

export const NOK_RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Other',
] as const;

export const EDUCATION_LEVELS = [
  'KCPE',
  'KCSE',
  'Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
] as const;

/** The database allows two next-of-kin slots. */
export const MAX_NEXT_OF_KIN = 2;

const text = (max: number) => z.string().trim().max(max, `Maximum ${max} characters.`);
const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, `Maximum ${max} characters.`);
const optionalDate = z
  .string()
  .refine((v) => v === '' || isValidIsoDate(v), 'Select a valid date.');
const requiredDate = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine(isValidIsoDate, 'Select a valid date.');

const nextOfKinRow = z.object({
  name: text(255),
  relation: text(100),
  phone: text(15),
});

const dependantRow = z.object({
  name: text(255),
  dob: optionalDate,
});

const educationRow = z.object({
  // Carried through unchanged so editing never destroys data the form
  // doesn't show (legacy rows can be professional/training with a start date).
  id: z.string(),
  type: z.enum(['academic', 'professional', 'training']),
  from: z.string(),
  school: text(255),
  attainment: text(100),
  specialization: text(255),
  year: z.string().trim(),
});

export const employeeFormSchema = z
  .object({
    // Personal
    surname: requiredText(255, 'Surname is required.'),
    otherNames: requiredText(255, 'Other names are required.'),
    gender: z.enum(['MALE', 'FEMALE'], { error: 'Select a gender.' }),
    dob: requiredDate('Date of birth is required.'),
    idNo: text(15),
    passport: text(50),
    maritalStatus: z.enum(['', 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
    nationality: text(100),
    ethnicity: text(100),

    // Contact
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required.')
      .refine(isValidKenyanPhone, 'Enter a valid phone number, e.g. 0722 123 456.'),
    alternativePhone: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || isValidKenyanPhone(v),
        'Enter a valid phone number, e.g. 0722 123 456.',
      ),
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address.'),
    postalAddress: text(255),
    postalCode: text(5),

    // Employment
    department: z.string().min(1, 'Select a department.'),
    designation: z.string().min(1, 'Select a designation.'),
    payrollNo: text(6),
    joiningDate: requiredDate('Date joined is required.'),
    employmentTerms: z.enum(['PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN', 'NO CONTRACT'], {
      error: 'Select employment terms.',
    }),
    expiryDate: optionalDate,
    // Carried through on edit; empty for a new employee (defaults to joiningDate).
    contractDate: optionalDate,
    employeeType: z.enum(['MANAGEMENT', 'WORKFLOOR', 'CONTRACTOR'], {
      error: 'Select an employee type.',
    }),
    workfloorType: z.enum(['', 'UNIONISABLE', 'NON-UNIONISABLE']),

    // Statutory & bank
    kraPin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => v === '' || /^[A-Z]\d{9}[A-Z]$/.test(v), 'KRA PIN looks like A000000000Z.'),
    nssf: text(50),
    shaNo: text(50),
    bankName: text(100),
    branchName: text(100),
    accountNo: text(50),

    // Repeaters
    nextOfKin: z.array(nextOfKinRow).max(MAX_NEXT_OF_KIN),
    dependants: z.array(dependantRow),
    education: z.array(educationRow),

    notes: text(2000),
  })
  .superRefine((data, ctx) => {
    const issue = (path: Array<string | number>, message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const today = getNairobiToday();

    if (data.dob && isValidIsoDate(data.dob)) {
      if (data.dob > today) issue(['dob'], 'Date of birth cannot be in the future.');
      else if (
        data.joiningDate &&
        isValidIsoDate(data.joiningDate) &&
        data.joiningDate <= data.dob
      ) {
        issue(['joiningDate'], 'Date joined must be after the date of birth.');
      }
    }

    if (data.employeeType === 'WORKFLOOR' && !data.workfloorType) {
      issue(['workfloorType'], 'Select a workfloor type.');
    }

    if (data.employmentTerms === 'CONTRACT' && !data.expiryDate) {
      issue(['expiryDate'], 'Contract end date is required.');
    }
    if (data.employmentTerms !== 'PERMANENT' && data.expiryDate) {
      const start = data.contractDate || data.joiningDate;
      if (start && data.expiryDate <= start) {
        issue(['expiryDate'], 'Contract end date must be after the start date.');
      }
    }

    data.nextOfKin.forEach((row, i) => {
      const used = row.name || row.relation || row.phone;
      if (!used) return;
      if (!row.name) issue(['nextOfKin', i, 'name'], 'Name is required.');
      if (row.phone && !isPlausiblePhone(row.phone)) {
        issue(['nextOfKin', i, 'phone'], 'Enter a valid phone number.');
      }
    });

    data.dependants.forEach((row, i) => {
      if (!row.name && !row.dob) return;
      if (!row.name) issue(['dependants', i, 'name'], 'Name is required.');
      if (!row.dob) issue(['dependants', i, 'dob'], 'Date of birth is required.');
      else if (row.dob > today) {
        issue(['dependants', i, 'dob'], 'Date of birth cannot be in the future.');
      }
    });

    const thisYear = Number(today.slice(0, 4));
    data.education.forEach((row, i) => {
      const used = row.school || row.attainment || row.specialization || row.year;
      if (!used) return;
      if (!row.school) issue(['education', i, 'school'], 'Institution is required.');
      if (row.year) {
        const year = Number(row.year);
        if (!/^\d{4}$/.test(row.year) || year < 1950 || year > thisYear) {
          issue(['education', i, 'year'], `Enter a year between 1950 and ${thisYear}.`);
        }
      }
    });
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const EMPTY_NEXT_OF_KIN = { name: '', relation: '', phone: '' };
export const EMPTY_DEPENDANT = { name: '', dob: '' };
export const emptyEducation = (): EmployeeFormValues['education'][number] => ({
  id: '',
  type: 'academic',
  from: '',
  school: '',
  attainment: '',
  specialization: '',
  year: '',
});

/** Values for a new employee. Enum fields start empty so the user must choose. */
export const EMPTY_EMPLOYEE_FORM = {
  surname: '',
  otherNames: '',
  gender: '',
  dob: '',
  idNo: '',
  passport: '',
  maritalStatus: '',
  nationality: 'Kenyan',
  ethnicity: '',
  phone: '',
  alternativePhone: '',
  email: '',
  postalAddress: '',
  postalCode: '',
  department: '',
  designation: '',
  payrollNo: '',
  joiningDate: '',
  employmentTerms: '',
  expiryDate: '',
  contractDate: '',
  employeeType: '',
  workfloorType: '',
  kraPin: '',
  nssf: '',
  shaNo: '',
  bankName: '',
  branchName: '',
  accountNo: '',
  nextOfKin: [{ ...EMPTY_NEXT_OF_KIN }],
  dependants: [],
  education: [],
  notes: '',
} as unknown as EmployeeFormValues;

/* ---------------- Required-field + section progress ---------------- */

export const SECTIONS = [
  { id: 'personal', title: 'Personal' },
  { id: 'contact', title: 'Contact' },
  { id: 'employment', title: 'Employment' },
  { id: 'statutory', title: 'Statutory & Bank' },
  { id: 'nok', title: 'Next of Kin & Dependants' },
  { id: 'education', title: 'Education' },
  { id: 'other', title: 'Notes' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

type RequiredField = { key: string; section: SectionId; done: boolean };

const filled = (value: string | undefined) => (value ?? '').trim() !== '';

/** The required fields for the current values, including conditional ones. */
export function getRequiredFields(v: EmployeeFormValues): Array<RequiredField> {
  const fields: Array<RequiredField> = [
    { key: 'surname', section: 'personal', done: filled(v.surname) },
    { key: 'otherNames', section: 'personal', done: filled(v.otherNames) },
    { key: 'gender', section: 'personal', done: filled(v.gender) },
    { key: 'dob', section: 'personal', done: filled(v.dob) },
    { key: 'phone', section: 'contact', done: filled(v.phone) },
    { key: 'department', section: 'employment', done: filled(v.department) },
    { key: 'designation', section: 'employment', done: filled(v.designation) },
    { key: 'joiningDate', section: 'employment', done: filled(v.joiningDate) },
    { key: 'employmentTerms', section: 'employment', done: filled(v.employmentTerms) },
    { key: 'employeeType', section: 'employment', done: filled(v.employeeType) },
  ];
  if (v.employeeType === 'WORKFLOOR') {
    fields.push({ key: 'workfloorType', section: 'employment', done: filled(v.workfloorType) });
  }
  if (v.employmentTerms === 'CONTRACT') {
    fields.push({ key: 'expiryDate', section: 'employment', done: filled(v.expiryDate) });
  }
  return fields;
}

export type SectionState = { state: 'done' | 'todo' | 'none'; sub: string };

const rowHasData = (row: Record<string, unknown>) =>
  Object.entries(row).some(([k, val]) => k !== 'id' && k !== 'type' && k !== 'from' && filled(val as string));

function optionalSectionHasData(id: SectionId, v: EmployeeFormValues) {
  switch (id) {
    case 'statutory':
      return [v.kraPin, v.nssf, v.shaNo, v.bankName, v.branchName, v.accountNo].some(filled);
    case 'nok':
      return v.nextOfKin.some(rowHasData) || v.dependants.some(rowHasData);
    case 'education':
      return v.education.some(rowHasData);
    case 'other':
      return filled(v.notes);
    default:
      return false;
  }
}

export function getSectionStates(v: EmployeeFormValues): Record<SectionId, SectionState> {
  const required = getRequiredFields(v);
  return Object.fromEntries(
    SECTIONS.map(({ id }) => {
      const reqs = required.filter((r) => r.section === id);
      if (reqs.length) {
        const done = reqs.filter((r) => r.done).length;
        return [
          id,
          done === reqs.length
            ? { state: 'done', sub: 'Complete' }
            : { state: 'todo', sub: `${done} of ${reqs.length} required` },
        ];
      }
      return optionalSectionHasData(id, v)
        ? [id, { state: 'done', sub: 'Added' }]
        : [id, { state: 'none', sub: 'Optional' }];
    }),
  ) as Record<SectionId, SectionState>;
}
