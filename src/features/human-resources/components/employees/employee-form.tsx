'use client';

import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Option } from '@/types/index.types';

import { notify } from '@/components/custom/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { SelectItem } from '@/components/ui/select';
import { SegmentedControl } from '@/features/human-resources/components/employees/segmented-control';
import { saveEmployee } from '@/features/human-resources/services/employees/actions';
import {
  EDUCATION_LEVELS,
  EMPLOYEE_TYPES,
  employeeFormSchema,
  type EmployeeFormValues,
  EMPLOYMENT_TERMS,
  EMPTY_DEPENDANT,
  EMPTY_EMPLOYEE_FORM,
  EMPTY_NEXT_OF_KIN,
  emptyEducation,
  GENDERS,
  getRequiredFields,
  getSectionStates,
  MARITAL_STATUSES,
  MAX_NEXT_OF_KIN,
  NOK_RELATIONSHIPS,
  type SectionId,
  SECTIONS,
  WORKFLOOR_TYPES,
} from '@/features/human-resources/utils/employees/form-schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { cn } from '@/lib/utils';

const LIST_PATH = '/human-resources/employees';
const GRID = 'grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6';

type Props = {
  options: { departments: Array<Option>; designations: Array<Option> };
  /** Present when editing. */
  employeeId?: number;
  initialValues?: EmployeeFormValues;
};

export function EmployeeForm({ options, employeeId, initialValues }: Props) {
  const router = useRouter();
  const isEdit = employeeId !== undefined;
  const [activeSection, setActiveSection] = useState<SectionId>('personal');

  const form = useAppForm({
    defaultValues: initialValues ?? EMPTY_EMPLOYEE_FORM,
    validators: { onSubmit: employeeFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => saveEmployee(value, employeeId),
        errorTitle: `Could not ${isEdit ? 'update' : 'create'} employee`,
        successTitle: isEdit ? 'Updated' : 'Created',
        fallbackMessage: 'Something went wrong. Please try again.',
        onSuccess: () => {
          router.push(
            isEdit ? `${LIST_PATH}/${employeeId}` : LIST_PATH,
          );
          router.refresh();
        },
      });
    },
    onSubmitInvalid: () => {
      const invalid = document.querySelector<HTMLElement>(
        '[data-slot=field][data-invalid=true]',
      );
      invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(
        () =>
          invalid
            ?.querySelector<HTMLElement>('input, button, [role=radio]')
            ?.focus({ preventScroll: true }),
        350,
      );
      notify.error('Check the highlighted fields', 'Some fields need attention.');
    },
  });

  // Highlight the section nearest the top while scrolling.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute('data-section') as SectionId);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    document
      .querySelectorAll('section[data-section]')
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const designationOptions = options.designations;

  return (
    <div className='items-start lg:grid lg:grid-cols-[14.5rem_1fr] lg:gap-8'>
      <aside className='mb-4 overflow-x-auto lg:sticky lg:top-6 lg:mb-0'>
        <form.Subscribe selector={(s) => s.values}>
          {(values) => (
            <SectionNav
              states={getSectionStates(values)}
              active={activeSection}
            />
          )}
        </form.Subscribe>
      </aside>

      <form
        noValidate
        className='min-w-0 space-y-5'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        {/* 1. Personal */}
        <FormSection
          id='personal'
          title='Personal Information'
          description='Legal name and identity details as they appear on the national ID.'
        >
          <div className={GRID}>
            <form.AppField name='surname'>
              {(f) => (
                <f.Input required label='Surname' autoComplete='off' fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='otherNames'>
              {(f) => (
                <f.Input required label='Other Names' autoComplete='off' fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='gender'>
              {(f) => (
                <f.Select required label='Gender' placeholder='Select…' fieldClassName='sm:col-span-2'>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </f.Select>
              )}
            </form.AppField>

            <form.AppField name='dob'>
              {(f) => (
                <f.Input required type='date' label='Date of birth' fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='idNo'>
              {(f) => (
                <f.Input label='ID Number' inputMode='numeric' maxLength={15} fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='passport'>
              {(f) => <f.Input label='Passport No (optional)' fieldClassName='sm:col-span-2' />}
            </form.AppField>

            <form.AppField name='maritalStatus'>
              {(f) => (
                <f.Select label='Marital Status' placeholder='Select…' fieldClassName='sm:col-span-2'>
                  {MARITAL_STATUSES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </f.Select>
              )}
            </form.AppField>
            <form.AppField name='nationality'>
              {(f) => <f.Input label='Nationality' fieldClassName='sm:col-span-2' />}
            </form.AppField>
            <form.AppField name='ethnicity'>
              {(f) => <f.Input label='Ethnicity' fieldClassName='sm:col-span-2' />}
            </form.AppField>
          </div>
        </FormSection>

        {/* 2. Contact */}
        <FormSection
          id='contact'
          title='Contact Details'
          description='How HR and the employee portal reach this person.'
        >
          <div className={GRID}>
            <form.AppField name='phone'>
              {(f) => (
                <f.Input
                  required
                  type='tel'
                  label='Phone No'
                  placeholder='07XX XXX XXX'
                  helperText='Also the employee’s portal login. They receive their temporary password here by SMS.'
                  fieldClassName='sm:col-span-2'
                />
              )}
            </form.AppField>
            <form.AppField name='alternativePhone'>
              {(f) => (
                <f.Input type='tel' label='Alternative Phone number' fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='email'>
              {(f) => (
                <f.Input
                  type='email'
                  label='Email address'
                  placeholder='name@panesars.co.ke'
                  helperText='Used for portal access.'
                  fieldClassName='sm:col-span-2'
                />
              )}
            </form.AppField>
            <form.AppField name='postalAddress'>
              {(f) => (
                <f.Input label='Postal address' placeholder='P.O. Box 12345' fieldClassName='sm:col-span-4' />
              )}
            </form.AppField>
            <form.AppField name='postalCode'>
              {(f) => (
                <f.Input label='Postal code' placeholder='00100' maxLength={5} fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
          </div>
        </FormSection>

        {/* 3. Employment */}
        <FormSection
          id='employment'
          title='Employment Details'
          description='Role, terms and payroll reference.'
        >
          <div className={GRID}>
            <form.AppField name='department'>
              {(f) => (
                <f.Select required label='Department' placeholder='Select…' fieldClassName='sm:col-span-2'>
                  {options.departments.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </f.Select>
              )}
            </form.AppField>
            <form.AppField name='designation'>
              {(f) => (
                <f.Select required label='Designation' placeholder='Select…' fieldClassName='sm:col-span-2'>
                  {designationOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </f.Select>
              )}
            </form.AppField>
            <form.AppField name='payrollNo'>
              {(f) => <f.Input label='Payroll No' maxLength={6} fieldClassName='sm:col-span-2' />}
            </form.AppField>

            <form.AppField name='joiningDate'>
              {(f) => (
                <f.Input required type='date' label='Date Joined' fieldClassName='sm:col-span-2' />
              )}
            </form.AppField>
            <form.AppField name='employmentTerms'>
              {(f) => (
                <f.Select required label='Employment Terms' placeholder='Select…' fieldClassName='sm:col-span-2'>
                  {EMPLOYMENT_TERMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </f.Select>
              )}
            </form.AppField>
            <form.Subscribe selector={(s) => s.values.employmentTerms}>
              {(terms) =>
                terms && terms !== 'PERMANENT' ? (
                  <form.AppField name='expiryDate'>
                    {(f) => (
                      <f.Input
                        required={terms === 'CONTRACT'}
                        type='date'
                        label='Contract end date'
                        fieldClassName='sm:col-span-2'
                      />
                    )}
                  </form.AppField>
                ) : null
              }
            </form.Subscribe>

            <form.AppField name='employeeType'>
              {(f) => {
                const invalid = f.state.meta.isTouched && !f.state.meta.isValid;
                return (
                  <Field data-invalid={invalid} className='sm:col-span-3'>
                    <FieldLabel id='employee-type-label'>
                      Employee Type <span className='text-destructive'>*</span>
                    </FieldLabel>
                    <SegmentedControl
                      name='employeeType'
                      labelledBy='employee-type-label'
                      value={f.state.value}
                      options={EMPLOYEE_TYPES}
                      invalid={invalid}
                      onBlur={f.handleBlur}
                      onChange={(v) => {
                        f.handleChange(v);
                        if (v !== 'WORKFLOOR') form.setFieldValue('workfloorType', '');
                      }}
                    />
                    {invalid && <FieldError errors={f.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.AppField>
            <form.Subscribe selector={(s) => s.values.employeeType}>
              {(type) =>
                type === 'WORKFLOOR' ? (
                  <form.AppField name='workfloorType'>
                    {(f) => {
                      const invalid = f.state.meta.isTouched && !f.state.meta.isValid;
                      return (
                        <Field data-invalid={invalid} className='sm:col-span-3'>
                          <FieldLabel id='workfloor-type-label'>
                            Workfloor type <span className='text-destructive'>*</span>
                          </FieldLabel>
                          <SegmentedControl
                            name='workfloorType'
                            labelledBy='workfloor-type-label'
                            value={f.state.value}
                            options={WORKFLOOR_TYPES}
                            invalid={invalid}
                            onBlur={f.handleBlur}
                            onChange={f.handleChange}
                          />
                          {invalid && <FieldError errors={f.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.AppField>
                ) : null
              }
            </form.Subscribe>
          </div>
        </FormSection>

        {/* 4. Statutory & bank */}
        <FormSection
          id='statutory'
          title='Statutory Details'
          description='Tax and social-security numbers used for payroll deductions.'
          optional
        >
          <div className={GRID}>
            <form.AppField name='kraPin'>
              {(f) => (
                <f.Input
                  label='KRA PIN'
                  placeholder='A000000000Z'
                  maxLength={11}
                  className='uppercase'
                  fieldClassName='sm:col-span-2'
                />
              )}
            </form.AppField>
            <form.AppField name='nssf'>
              {(f) => <f.Input label='NSSF No' fieldClassName='sm:col-span-2' />}
            </form.AppField>
            <form.AppField name='shaNo'>
              {(f) => <f.Input label='SHA No' fieldClassName='sm:col-span-2' />}
            </form.AppField>
          </div>
          <SubTitle>Bank details (salary payment)</SubTitle>
          <div className={GRID}>
            <form.AppField name='bankName'>
              {(f) => <f.Input label='Bank' fieldClassName='sm:col-span-2' />}
            </form.AppField>
            <form.AppField name='branchName'>
              {(f) => <f.Input label='Branch' fieldClassName='sm:col-span-2' />}
            </form.AppField>
            <form.AppField name='accountNo'>
              {(f) => <f.Input label='Account No' inputMode='numeric' fieldClassName='sm:col-span-2' />}
            </form.AppField>
          </div>
        </FormSection>

        {/* 5. Next of kin & dependants */}
        <FormSection
          id='nok'
          title='Next of Kin & Dependants'
          description='Emergency contacts and people the employee supports.'
          optional
        >
          <form.AppField name='nextOfKin' mode='array'>
            {(arr) => (
              <>
                <RepeaterHeader
                  title='Next of kin'
                  addLabel='+ Add next of kin'
                  disabled={arr.state.value.length >= MAX_NEXT_OF_KIN}
                  hint={
                    arr.state.value.length >= MAX_NEXT_OF_KIN
                      ? `Up to ${MAX_NEXT_OF_KIN} people can be recorded.`
                      : undefined
                  }
                  onAdd={() => arr.pushValue({ ...EMPTY_NEXT_OF_KIN })}
                />
                {arr.state.value.map((row, i) => (
                  <RepeaterRow
                    key={i}
                    title='Next of kin'
                    index={i}
                    count={arr.state.value.length}
                    // The first row always stays so there is somewhere to type.
                    canRemove={arr.state.value.length > 1}
                    onRemove={() => arr.removeValue(i)}
                  >
                    <div className={GRID}>
                      <form.AppField name={`nextOfKin[${i}].name`}>
                        {(f) => <f.Input label='Full name' fieldClassName='sm:col-span-2' />}
                      </form.AppField>
                      <form.AppField name={`nextOfKin[${i}].relation`}>
                        {(f) => (
                          <f.Select label='Relationship' placeholder='Select…' fieldClassName='sm:col-span-2'>
                            {withCurrent(NOK_RELATIONSHIPS, row.relation).map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </f.Select>
                        )}
                      </form.AppField>
                      <form.AppField name={`nextOfKin[${i}].phone`}>
                        {(f) => <f.Input type='tel' label='Phone No' fieldClassName='sm:col-span-2' />}
                      </form.AppField>
                    </div>
                  </RepeaterRow>
                ))}
              </>
            )}
          </form.AppField>

          <div className='border-border mt-7 border-t pt-6'>
            <form.AppField name='dependants' mode='array'>
              {(arr) => (
                <>
                  <RepeaterHeader
                    title='Dependants'
                    addLabel='+ Add dependant'
                    onAdd={() => arr.pushValue({ ...EMPTY_DEPENDANT })}
                  />
                  {arr.state.value.length === 0 && <EmptyRepeater>No dependants added.</EmptyRepeater>}
                  {arr.state.value.map((_, i) => (
                    <RepeaterRow
                      key={i}
                      title='Dependant'
                      index={i}
                      count={arr.state.value.length}
                      canRemove
                      onRemove={() => arr.removeValue(i)}
                    >
                      <div className={GRID}>
                        <form.AppField name={`dependants[${i}].name`}>
                          {(f) => <f.Input label='Full name' fieldClassName='sm:col-span-3' />}
                        </form.AppField>
                        <form.AppField name={`dependants[${i}].dob`}>
                          {(f) => (
                            <f.Input type='date' label='Date of birth' fieldClassName='sm:col-span-3' />
                          )}
                        </form.AppField>
                      </div>
                    </RepeaterRow>
                  ))}
                </>
              )}
            </form.AppField>
          </div>
        </FormSection>

        {/* 6. Education */}
        <FormSection
          id='education'
          title='Education Details'
          description='Highest qualifications first.'
          optional
        >
          <form.AppField name='education' mode='array'>
            {(arr) => (
              <>
                {arr.state.value.length === 0 && <EmptyRepeater>No qualifications added.</EmptyRepeater>}
                {arr.state.value.map((row, i) => (
                  <RepeaterRow
                    key={i}
                    title='Qualification'
                    index={i}
                    count={arr.state.value.length}
                    canRemove
                    onRemove={() => arr.removeValue(i)}
                  >
                    <div className={GRID}>
                      <form.AppField name={`education[${i}].school`}>
                        {(f) => <f.Input label='Institution' fieldClassName='sm:col-span-3' />}
                      </form.AppField>
                      <form.AppField name={`education[${i}].attainment`}>
                        {(f) => (
                          <f.Select label='Level' placeholder='Select…' fieldClassName='sm:col-span-3'>
                            {withCurrent(EDUCATION_LEVELS, row.attainment).map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </f.Select>
                        )}
                      </form.AppField>
                      <form.AppField name={`education[${i}].specialization`}>
                        {(f) => (
                          <f.Input label='Course / Field of study' fieldClassName='sm:col-span-4' />
                        )}
                      </form.AppField>
                      <form.AppField name={`education[${i}].year`}>
                        {(f) => (
                          <f.Input
                            label='Year completed'
                            inputMode='numeric'
                            maxLength={4}
                            placeholder='2020'
                            fieldClassName='sm:col-span-2'
                          />
                        )}
                      </form.AppField>
                    </div>
                  </RepeaterRow>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-3'
                  onClick={() => arr.pushValue(emptyEducation())}
                >
                  + Add qualification
                </Button>
              </>
            )}
          </form.AppField>
        </FormSection>

        {/* 7. Notes */}
        <FormSection
          id='other'
          title='Other Details'
          description='Notes for HR.'
          optional
        >
          <form.AppField name='notes'>
            {(f) => (
              <f.Textarea
                label='Notes (visible to HR only)'
                placeholder='Anything else HR should know…'
              />
            )}
          </form.AppField>
        </FormSection>

        {/* Footer */}
        <div className='bg-background/90 sticky bottom-0 z-30 -mx-1 flex items-center justify-between gap-3 border-t px-1 py-3 backdrop-blur'>
          <form.Subscribe selector={(s) => s.values}>
            {(values) => {
              const required = getRequiredFields(values);
              const done = required.filter((r) => r.done).length;
              return (
                <div className='flex min-w-0 items-center gap-3'>
                  <div
                    aria-hidden
                    className='bg-muted h-1.5 w-36 overflow-hidden rounded-full'
                  >
                    <div
                      className='bg-primary h-full rounded-full transition-[width]'
                      style={{ width: `${(done / required.length) * 100}%` }}
                    />
                  </div>
                  <p className='text-muted-foreground truncate text-xs'>
                    <span className='text-foreground font-semibold'>
                      {done} of {required.length}
                    </span>{' '}
                    <span className='hidden sm:inline'>required fields complete</span>
                    <span className='sm:hidden'>required</span>
                  </p>
                </div>
              );
            }}
          </form.Subscribe>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                router.push(isEdit ? `${LIST_PATH}/${employeeId}` : LIST_PATH)
              }
            >
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type='submit' disabled={isSubmitting}>
                  <LoadingSwap isLoading={isSubmitting} className='flex items-center gap-2'>
                    <CheckIcon />
                    {isEdit ? 'Save Changes' : 'Create Employee'}
                  </LoadingSwap>
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Legacy records can hold a value that isn't one of the standard choices. */
function withCurrent<T extends string>(list: ReadonlyArray<T>, current: string) {
  return current && !list.includes(current as T)
    ? [...list, current]
    : [...list];
}

function SectionNav({
  states,
  active,
}: {
  states: ReturnType<typeof getSectionStates>;
  active: SectionId;
}) {
  return (
    <nav
      aria-label='Form sections'
      className='flex gap-1.5 lg:flex-col lg:gap-0.5'
    >
      {SECTIONS.map((section, index) => {
        const { state, sub } = states[section.id];
        return (
          <a
            key={section.id}
            href={`#sec-${section.id}`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(`sec-${section.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-2 whitespace-nowrap transition-colors',
              active === section.id && 'bg-muted text-foreground',
            )}
          >
            <span
              className={cn(
                'bg-card inline-flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[0.625rem] font-bold',
                active === section.id && 'border-primary text-primary',
                state === 'todo' && 'border-warning-foreground text-warning-foreground',
                state === 'done' && 'bg-success-foreground border-success-foreground text-white',
              )}
            >
              {state === 'done' ? <CheckIcon className='size-3' strokeWidth={3.5} /> : index + 1}
            </span>
            <span>
              <span className='block text-[0.8125rem] leading-tight font-medium'>{section.title}</span>
              <span className='text-muted-foreground mt-px hidden text-[0.6875rem] lg:block'>{sub}</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

function FormSection({
  id,
  title,
  description,
  optional,
  children,
}: {
  id: SectionId;
  title: string;
  description: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`sec-${id}`}
      data-section={id}
      className='bg-card scroll-mt-6 rounded-xl border'
    >
      <div className='flex items-start justify-between gap-4 border-b px-5 pt-4 pb-3.5'>
        <div>
          <h2 className='text-[0.9375rem] font-semibold tracking-tight'>{title}</h2>
          <p className='text-muted-foreground mt-0.5 text-xs'>{description}</p>
        </div>
        {optional && <Badge variant='secondary'>Optional</Badge>}
      </div>
      <div className='px-5 pt-5 pb-5'>{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='text-muted-foreground mt-6 mb-3.5 border-t pt-5 text-[0.6875rem] font-semibold tracking-wider uppercase'>
      {children}
    </h3>
  );
}

function RepeaterHeader({
  title,
  addLabel,
  onAdd,
  disabled,
  hint,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className='mb-3 flex items-center justify-between gap-3'>
      <h3 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
        {title}
      </h3>
      <div className='flex items-center gap-3'>
        {hint && <span className='text-muted-foreground text-[0.6875rem]'>{hint}</span>}
        <Button type='button' variant='outline' size='sm' disabled={disabled} onClick={onAdd}>
          <PlusIcon className='size-3.5' />
          {addLabel.replace(/^\+\s*/, '')}
        </Button>
      </div>
    </div>
  );
}

function RepeaterRow({
  title,
  index,
  count,
  canRemove,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  count: number;
  canRemove: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='bg-muted/45 border-border mt-3 rounded-xl border px-4 pt-3.5 pb-4 first:mt-0'>
      <div className='mb-3 flex items-center justify-between'>
        <span className='text-xs font-semibold'>
          {count > 1 ? `${title} ${index + 1}` : title}
        </span>
        {canRemove && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='hover:text-destructive size-7'
            aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2Icon className='size-4' />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRepeater({ children }: { children: React.ReactNode }) {
  return (
    <div className='border-input text-muted-foreground flex flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed px-4 py-6 text-center text-sm'>
      {children}
    </div>
  );
}
