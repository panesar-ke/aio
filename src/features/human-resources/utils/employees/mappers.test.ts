import { describe, expect, it } from 'vitest';

import { type EmployeeFormValues, EMPTY_EMPLOYEE_FORM } from './form-schema';
import { contractMonths, toDbRecords, toFormValues } from './mappers';

const base = (over: Partial<EmployeeFormValues> = {}): EmployeeFormValues => ({
  ...EMPTY_EMPLOYEE_FORM,
  surname: 'Mwangi',
  otherNames: 'Jane',
  gender: 'FEMALE',
  dob: '1990-05-10',
  phone: '0722 123 456',
  department: '3',
  designation: '7',
  joiningDate: '2024-01-15',
  employmentTerms: 'PERMANENT',
  employeeType: 'MANAGEMENT',
  ...over,
});

describe('contractMonths', () => {
  it('rounds to the nearest month with a minimum of one', () => {
    expect(contractMonths('2024-01-01', '2024-12-31')).toBe(12);
    expect(contractMonths('2024-01-01', '2024-07-01')).toBe(6);
    expect(contractMonths('2024-01-01', '2024-01-05')).toBe(1);
  });
});

describe('toDbRecords', () => {
  it('maps a permanent employee and nulls empty optionals', () => {
    const r = toDbRecords(base());
    expect(r.employee).toMatchObject({
      department: 3,
      designation: 7,
      employmentType: 'PERMANENT',
      contractDate: '2024-01-15',
      contractDuration: 0,
      expiryDate: null,
      idNo: null,
      workfloorType: null,
      maritalStatus: null,
      remarks: null,
    });
    expect(r.contact.primaryContact).toBe('0722123456');
    expect(r.contact.emailAddress).toBeNull();
    expect(r.children).toEqual([]);
  });

  it('ignores the contract end date for permanent staff', () => {
    expect(toDbRecords(base({ expiryDate: '2025-01-15' })).employee.expiryDate).toBeNull();
  });

  it('derives duration for contracts and keeps an existing contract start', () => {
    const r = toDbRecords(
      base({ employmentTerms: 'CONTRACT', expiryDate: '2025-01-15', contractDate: '2024-07-15' }),
    );
    expect(r.employee).toMatchObject({
      contractDate: '2024-07-15',
      expiryDate: '2025-01-15',
      contractDuration: 6,
    });
  });

  it('only keeps the workfloor type for workfloor employees', () => {
    expect(
      toDbRecords(base({ employeeType: 'WORKFLOOR', workfloorType: 'UNIONISABLE' })).employee
        .workfloorType,
    ).toBe('UNIONISABLE');
    expect(
      toDbRecords(base({ employeeType: 'CONTRACTOR', workfloorType: 'UNIONISABLE' })).employee
        .workfloorType,
    ).toBeNull();
  });

  it('maps next of kin to the two slots and drops blank rows', () => {
    const r = toDbRecords(
      base({
        nextOfKin: [
          { name: 'Ann', relation: 'Spouse', phone: '+254711000111' },
          { name: '', relation: '', phone: '' },
          { name: 'Bob', relation: 'Parent', phone: '020 123 4567' },
        ],
      }),
    );
    // Blank rows are dropped first, so Bob moves into the second slot.
    expect(r.nok).toMatchObject({
      nameOne: 'Ann',
      contactOne: '0711000111',
      nameTwo: 'Bob',
      contactTwo: '020 123 4567',
    });
  });

  it('keeps qualification passthrough fields and the year', () => {
    const r = toDbRecords(
      base({
        education: [
          {
            id: 'q1',
            type: 'professional',
            from: '2018',
            school: 'KIM',
            attainment: 'Diploma',
            specialization: '',
            year: '2020',
          },
          {
            id: '',
            type: 'academic',
            from: '',
            school: '',
            attainment: '',
            specialization: '',
            year: '',
          },
        ],
      }),
    );
    expect(r.qualifications).toEqual([
      {
        id: 'q1',
        qualificationType: 'professional',
        from: '2018',
        to: '2020',
        school: 'KIM',
        attainment: 'Diploma',
        specialization: null,
      },
    ]);
  });
});

describe('toFormValues', () => {
  const src = {
    employee: {
      surname: 'Mwangi',
      otherNames: 'Jane',
      gender: 'FEMALE' as const,
      dob: '1990-05-10',
      maritalStatus: null,
      idNo: null,
      payrollNo: null,
      department: 3,
      designation: 7,
      employmentType: null,
      contractDate: null,
      joiningDate: '2024-01-15',
      expiryDate: null,
      employeeCategory: 'UNIONISABLE' as const,
      workfloorType: null,
      nationality: 'Kenyan',
      ethnicity: null,
      remarks: null,
    },
    contact: null,
    nok: null,
    other: null,
    children: [],
    qualifications: [
      {
        id: 'q',
        qualificationType: 'training' as const,
        from: null,
        to: '2020-05-01',
        school: 'X',
        attainment: null,
        specialization: null,
      },
    ],
  };

  it('maps legacy union categories onto workfloor + workfloor type', () => {
    const v = toFormValues(src);
    expect(v.employeeType).toBe('WORKFLOOR');
    expect(v.workfloorType).toBe('UNIONISABLE');
    expect(v.department).toBe('3');
    expect(v.nextOfKin).toHaveLength(1); // always one row to fill in
    expect(v.education[0]).toMatchObject({ id: 'q', type: 'training', year: '2020' });
  });

  it('round-trips through toDbRecords', () => {
    const values = toFormValues({
      ...src,
      employee: { ...src.employee, employmentType: 'PERMANENT' },
    });
    expect(toDbRecords(values).employee).toMatchObject({
      department: 3,
      designation: 7,
      employeeCategory: 'WORKFLOOR',
      workfloorType: 'UNIONISABLE',
      joiningDate: '2024-01-15',
    });
  });
});
