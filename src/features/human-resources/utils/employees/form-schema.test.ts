import { describe, expect, it } from 'vitest';

import {
  employeeFormSchema,
  type EmployeeFormValues,
  EMPTY_EMPLOYEE_FORM,
  getRequiredFields,
  getSectionStates,
} from './form-schema';

const valid = (over: Partial<EmployeeFormValues> = {}): EmployeeFormValues => ({
  ...EMPTY_EMPLOYEE_FORM,
  surname: 'Mwangi',
  otherNames: 'Jane Wanjiru',
  gender: 'FEMALE',
  dob: '1990-05-10',
  phone: '0722 123 456',
  department: '1',
  designation: '2',
  joiningDate: '2024-01-15',
  employmentTerms: 'PERMANENT',
  employeeType: 'MANAGEMENT',
  ...over,
});

const errorPaths = (values: EmployeeFormValues) => {
  const result = employeeFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('employeeFormSchema', () => {
  it('accepts a minimal valid employee', () => {
    expect(errorPaths(valid())).toEqual([]);
  });

  it('requires the core fields on an empty form', () => {
    const paths = errorPaths(EMPTY_EMPLOYEE_FORM);
    for (const p of [
      'surname',
      'otherNames',
      'gender',
      'dob',
      'phone',
      'department',
      'designation',
      'joiningDate',
      'employmentTerms',
      'employeeType',
    ]) {
      expect(paths).toContain(p);
    }
  });

  it('requires a workfloor type only for workfloor employees', () => {
    expect(errorPaths(valid({ employeeType: 'WORKFLOOR' }))).toContain('workfloorType');
    expect(
      errorPaths(valid({ employeeType: 'WORKFLOOR', workfloorType: 'UNIONISABLE' })),
    ).toEqual([]);
  });

  it('requires a contract end date for contracts, after the start', () => {
    expect(errorPaths(valid({ employmentTerms: 'CONTRACT' }))).toContain('expiryDate');
    expect(
      errorPaths(valid({ employmentTerms: 'CONTRACT', expiryDate: '2024-01-15' })),
    ).toContain('expiryDate');
    expect(
      errorPaths(valid({ employmentTerms: 'CONTRACT', expiryDate: '2025-01-14' })),
    ).toEqual([]);
    // Other non-permanent terms may omit it.
    expect(errorPaths(valid({ employmentTerms: 'CASUAL' }))).toEqual([]);
  });

  it('validates phone, email, KRA PIN and dates', () => {
    expect(errorPaths(valid({ phone: '12345' }))).toContain('phone');
    expect(errorPaths(valid({ email: 'nope' }))).toContain('email');
    expect(errorPaths(valid({ kraPin: 'bad' }))).toContain('kraPin');
    expect(errorPaths(valid({ kraPin: 'a123456789z' }))).toEqual([]);
    expect(errorPaths(valid({ dob: '1990-02-30' }))).toContain('dob');
    expect(errorPaths(valid({ joiningDate: '1989-01-01' }))).toContain('joiningDate');
  });

  it('ignores blank repeater rows but validates partial ones', () => {
    expect(errorPaths(valid({ dependants: [{ name: '', dob: '' }], education: [] }))).toEqual([]);
    expect(errorPaths(valid({ dependants: [{ name: 'Kid', dob: '' }] }))).toContain(
      'dependants.0.dob',
    );
    expect(
      errorPaths(valid({ nextOfKin: [{ name: '', relation: 'Spouse', phone: '' }] })),
    ).toContain('nextOfKin.0.name');
  });

  it('allows at most two next of kin', () => {
    const row = { name: 'A', relation: 'Spouse', phone: '' };
    expect(errorPaths(valid({ nextOfKin: [row, row, row] })).length).toBeGreaterThan(0);
  });
});

describe('required fields and section states', () => {
  it('counts conditional required fields', () => {
    expect(getRequiredFields(valid()).length).toBe(10);
    expect(getRequiredFields(valid({ employeeType: 'WORKFLOOR' })).length).toBe(11);
    expect(
      getRequiredFields(valid({ employeeType: 'WORKFLOOR', employmentTerms: 'CONTRACT' })).length,
    ).toBe(12);
  });

  it('reports section progress', () => {
    const states = getSectionStates(EMPTY_EMPLOYEE_FORM);
    expect(states.personal).toEqual({ state: 'todo', sub: '0 of 4 required' });
    expect(states.statutory).toEqual({ state: 'none', sub: 'Optional' });

    const full = getSectionStates(valid({ kraPin: 'A123456789Z' }));
    expect(full.personal.state).toBe('done');
    expect(full.employment.sub).toBe('Complete');
    expect(full.statutory).toEqual({ state: 'done', sub: 'Added' });
  });
});
