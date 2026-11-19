import type { ReactNode } from 'react';

import type { getEmployeeDetails } from '@/features/human-resources/services/employees/data';

import { Badge } from '@/components/ui/badge';
import {
  type EmployeeDisplayStatus,
  STATUS_LABELS,
} from '@/features/human-resources/utils/employees/employees.types';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';

type Details = NonNullable<Awaited<ReturnType<typeof getEmployeeDetails>>>;

const text = (value: string | null | undefined) =>
  value ? titleCase(value.replace(/-/g, ' ')) : null;
const date = (value: string | null | undefined) =>
  value ? dateFormat(value, 'long') : null;

function Section({
  title,
  fields,
}: {
  title: string;
  fields: Array<[label: string, value: ReactNode]>;
}) {
  return (
    <section className='bg-card rounded-xl border p-5'>
      <h2 className='mb-4 text-sm font-semibold'>{title}</h2>
      <dl className='grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3'>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className='text-muted-foreground text-xs'>{label}</dt>
            <dd className='mt-0.5 text-sm font-medium'>
              {value || <span className='text-muted-foreground'>—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EmployeeDetails({
  employee: e,
  status,
}: {
  employee: Details;
  status: EmployeeDisplayStatus;
}) {
  const sensitive = 'idNo' in e;

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='text-xl font-semibold'>
          {`${e.otherNames} ${e.surname}`.toUpperCase()}
        </h2>
        <Badge variant={status === 'ACTIVE' ? 'success' : 'secondary'}>
          {STATUS_LABELS[status]}
        </Badge>
        <span className='text-muted-foreground text-sm'>
          {e.designation} · {e.department}
        </span>
      </div>

      {e.lastExit && status !== 'ACTIVE' && status !== 'ON_LEAVE' && (
        <div className='bg-muted rounded-xl border p-4 text-sm'>
          <p className='font-medium'>
            {STATUS_LABELS[status]} on {date(e.lastExit.date)}
          </p>
          <p className='text-muted-foreground mt-1'>{e.lastExit.reason}</p>
          {e.lastExit.remarks && (
            <p className='text-muted-foreground mt-1'>{e.lastExit.remarks}</p>
          )}
        </div>
      )}

      <Section
        title='Personal'
        fields={[
          ['Employee No', e.id],
          ['Payroll No', e.payrollNo],
          ['Gender', text(e.gender)],
          ['Marital status', text(e.maritalStatus)],
          ['Nationality', e.nationality],
          ['Ethnicity', e.ethnicity],
          ['Education level', text(e.educationLevel)],
          ...(sensitive
            ? ([
                ['ID No', e.idNo],
                ['Date of birth', date(e.dob)],
                ['Phone', e.phone],
                ['Email', e.email],
              ] as Array<[string, ReactNode]>)
            : []),
        ]}
      />

      <Section
        title='Employment'
        fields={[
          ['Department', e.department],
          ['Designation', e.designation],
          ['Employment type', text(e.employmentType)],
          ['Category', text(e.category)],
          ['Date joined', date(e.joiningDate)],
          ['Contract start', date(e.contractDate)],
          [
            'Contract duration',
            e.contractDuration > 0 ? `${e.contractDuration} months` : null,
          ],
          ['Contract expiry', date(e.expiryDate)],
          ['Remarks', e.remarks],
        ]}
      />

      {sensitive && (
        <>
          <Section
            title='Statutory'
            fields={[
              ['KRA PIN', e.kraPin],
              ['NSSF No', e.nssf],
              ['SHA No', e.shaNo],
            ]}
          />
          <Section
            title='Banking'
            fields={[
              ['Bank', e.bankName],
              ['Branch', e.branchName],
              ['Account No', e.accountNo],
              ['Account name', e.accountName],
            ]}
          />
        </>
      )}
    </div>
  );
}
