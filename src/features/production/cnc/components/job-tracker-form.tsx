'use client';

import { useForm } from 'react-hook-form';
import type { JobTrackerFormValues } from '@/features/production/cnc/utils/cnc.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobTrackerSchema } from '@/features/production/cnc/utils/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { dateFormat } from '@/lib/helpers/formatters';
import { DateTimePicker } from '@/lib/datetime-picker/date-time-picker';
import { FormActions } from '@/components/custom/form-actions';
import { useModal } from '@/features/integrations/modal-provider';
import { upsertJobTrackerEntry } from '@/features/production/cnc/services/action';
import { ToastContent } from '@/components/custom/toast';
import toast from 'react-hot-toast';
import { MiniSelect } from '@/components/custom/mini-select';

export function JobTrackerForm({ data }: { data?: JobTrackerFormValues }) {
  const { setClose } = useModal();
  const form = useForm<JobTrackerFormValues>({
    resolver: zodResolver(jobTrackerSchema),
    defaultValues: data || {
      jobCardNo: '',
      jobDescription: '',
      jobType: '',
      dateReceived: new Date(),
      status: 'in progress',
    },
  });

  async function onSubmit(values: JobTrackerFormValues) {
    const res = await upsertJobTrackerEntry(values);
    if (res.error) {
      toast.error(() => <ToastContent title="Error:" message={res.message} />);
      return;
    }
    form.reset();
    setClose();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid md:grid-cols-2 gap-4"
      >
        <FormField
          control={form.control}
          name="jobCardNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Job Card No<sup className="text-red-500">*</sup>
              </FormLabel>
              <FormControl>
                <Input {...field} maxLength={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateReceived"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date Received<sup className="text-red-500">*</sup>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={field.value ? dateFormat(field.value) : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>
                Job Description<sup className="text-red-500">*</sup>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Job Type<sup className="text-red-500">*</sup>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => {
            console.log(field.value);
            return (
              <FormItem>
                <FormLabel>
                  Start Date & Time <sup className="text-red-500">*</sup>
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={val => {
                      console.log(val);
                      field.onChange(val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date & Time</FormLabel>
              <FormControl>
                <DateTimePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeTaken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Taken</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <MiniSelect
                  defaultValue={field.value}
                  options={[
                    { value: 'in progress', label: 'In Progress' },
                    { value: 'on hold', label: 'On Hold' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                  {...field}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormActions
          isEdit={false}
          isPending={form.formState.isSubmitting}
          resetFn={() => {
            form.reset();
            setClose();
          }}
          className="col-span-full"
        />
      </form>
    </Form>
  );
}
