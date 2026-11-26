'use client';

import { useRouter } from 'next/navigation';

import { notify } from '@/components/custom/toast';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { saveLeaveApplication } from '@/features/human-resources/services/leave/actions';
import {
  countLeaveDays,
  suggestResumeDate,
} from '@/features/human-resources/utils/leave/days';
import {
  CATEGORY_LABELS,
  formatLeaveType,
  LEAVE_FORM_CATEGORIES,
  type LeaveFormCategory,
} from '@/features/human-resources/utils/leave/leave.types';
import {
  leaveFormSchema,
  type LeaveFormValues,
} from '@/features/human-resources/utils/leave/schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

const LIST_PATH = '/human-resources/leave-management';

type Props = {
  options: {
    employees: Array<{
      id: number;
      name: string;
      category: LeaveFormCategory;
    }>;
    leaveTypes: Array<{ id: number; name: string }>;
  };
  leaveNo: number;
  initialValues: LeaveFormValues;
  /** Present when editing: the employee and category already on the record. */
  recorded?: { employeeId: number; category: LeaveFormCategory };
};

export function LeaveForm({
  options,
  leaveNo,
  initialValues,
  recorded,
}: Props) {
  const router = useRouter();
  const isEdit = recorded !== undefined;

  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: leaveFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => saveLeaveApplication(value, isEdit ? leaveNo : undefined),
        errorTitle: `Could not ${isEdit ? 'update' : 'save'} leave`,
        successTitle: isEdit ? 'Updated' : 'Saved',
        fallbackMessage: 'Something went wrong. Please try again.',
        onSuccess: () => {
          // The page is preserved after navigating away, so clear the draft.
          form.reset();
          router.push(LIST_PATH);
        },
      });
    },
    onSubmitInvalid: () => {
      notify.error(
        'Check the highlighted fields',
        'Some fields need attention.',
      );
    },
  });

  function employeesIn(category: string) {
    return options.employees
      .filter((e) =>
        e.id === recorded?.employeeId
          ? category === recorded.category
          : e.category === category,
      )
      .map((e) => ({ value: String(e.id), label: e.name }));
  }

  return (
    <form
      noValidate
      className='bg-card max-w-4xl space-y-6 rounded-xl border p-5 sm:p-6'
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className='grid grid-cols-1 items-start gap-4 sm:grid-cols-6'>
        <Field className='sm:col-span-3'>
          <FieldLabel htmlFor='leaveNo'>Leave No</FieldLabel>
          <Input id='leaveNo' value={leaveNo} readOnly className='bg-muted' />
        </Field>
        <form.AppField name='applicationDate'>
          {(f) => (
            <f.Input
              required
              type='date'
              label='Application Date'
              fieldClassName='sm:col-span-3'
            />
          )}
        </form.AppField>

        <form.AppField
          name='employeeCategory'
          listeners={{
            onChange: () => form.setFieldValue('employeeId', ''),
          }}
        >
          {(f) => (
            <f.Select
              required
              label='Employee Category'
              placeholder='Select a category'
              fieldClassName='sm:col-span-3'
              className='w-full'
            >
              {LEAVE_FORM_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </f.Select>
          )}
        </form.AppField>
        <form.Subscribe selector={(s) => s.values.employeeCategory}>
          {(category) => (
            <form.AppField name='employeeId'>
              {(f) => (
                <f.Combobox
                  required
                  label='Employee'
                  items={employeesIn(category)}
                  disabled={!category}
                  placeholder={
                    category ? 'Select an employee' : 'Select a category first'
                  }
                  searchPlaceholder='Search employees'
                  emptyMessage='No employees found.'
                  fieldClassName='sm:col-span-3'
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>

        <form.AppField name='leaveTypeId'>
          {(f) => (
            <f.Select
              required
              label='Leave Type'
              placeholder='Select a leave type'
              fieldClassName='sm:col-span-6'
              className='w-full'
            >
              {options.leaveTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {formatLeaveType(t.name)}
                </SelectItem>
              ))}
            </f.Select>
          )}
        </form.AppField>

        <form.AppField name='startDate'>
          {(f) => (
            <f.Input
              required
              type='date'
              label='Start Date'
              fieldClassName='sm:col-span-2'
            />
          )}
        </form.AppField>
        <form.AppField
          name='endDate'
          listeners={{
            onChange: ({ value }) =>
              form.setFieldValue('resumeDate', suggestResumeDate(value)),
          }}
        >
          {(f) => (
            <f.Input
              required
              type='date'
              label='End Date'
              fieldClassName='sm:col-span-2'
            />
          )}
        </form.AppField>
        <form.AppField name='resumeDate'>
          {(f) => (
            <f.Input
              required
              type='date'
              label='Resume Date'
              helperText='Filled in from the end date. You can change it.'
              fieldClassName='sm:col-span-2'
            />
          )}
        </form.AppField>

        <form.AppField name='halfDay'>
          {(f) => (
            <Field orientation='horizontal' className='sm:col-span-3 sm:pt-8'>
              <Switch
                id={f.name}
                checked={f.state.value}
                onCheckedChange={(checked) => f.handleChange(checked)}
              />
              <FieldLabel htmlFor={f.name}>
                Half day (takes 0.5 off the total)
              </FieldLabel>
            </Field>
          )}
        </form.AppField>
        <form.Subscribe
          selector={(s) =>
            countLeaveDays(
              s.values.startDate,
              s.values.endDate,
              s.values.halfDay,
            )
          }
        >
          {(days) => (
            <Field className='sm:col-span-3'>
              <FieldLabel htmlFor='totalDays'>Total Days</FieldLabel>
              <Input
                id='totalDays'
                value={days}
                readOnly
                className='bg-muted tabular-nums'
              />
              <p className='text-muted-foreground text-xs'>
                Sundays are excluded and Saturdays count as half a day.
              </p>
            </Field>
          )}
        </form.Subscribe>

        <form.AppField name='reason'>
          {(f) => (
            <f.Textarea
              required
              label='Reason for Leave'
              maxLength={1000}
              className='min-h-24'
              fieldClassName='sm:col-span-6'
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton
          buttonText={isEdit ? 'Save Changes' : 'Save Application'}
          withReset
          onReset={() => {
            form.reset();
            router.push(LIST_PATH);
          }}
        />
      </form.AppForm>
    </form>
  );
}
