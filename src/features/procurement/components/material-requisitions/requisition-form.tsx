'use client';

import { createId } from '@paralleldrive/cuid2';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircleCheckBigIcon,
  CircleXIcon,
  SparkleIcon,
  Trash2Icon,
} from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  MaterialRequisitionFormValues,
  Requisition,
} from '@/features/procurement/utils/procurement.types';
import type { Option } from '@/types/index.types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { materialRequisitionFormSchema } from '@/features/procurement/utils/schemas';
import { Input } from '@/components/ui/input';
import { dateFormat } from '@/lib/helpers/formatters';
import { Button } from '@/components/ui/button';
import { MiniSelect } from '@/components/custom/mini-select';
import { SearchSelect } from '@/components/custom/search-select';
import { createRequisition } from '@/features/procurement/services/material-requisitions/action';
import { useError } from '@/hooks/use-error';
import { CustomAlert } from '@/components/custom/custom-alert';
import { ButtonLoader } from '@/components/custom/loaders';
import { useRef, useState } from 'react';
import { useProcurementServices } from '../../hooks/use-procurement-services';

interface RequisitionFormProps {
  requisitionNo: number;
  projects: Array<Option>;
  products: Array<Option>;
  services: Array<Option>;
  requisition?: Requisition;
}

const INITIAL_DETAILS = [
  {
    id: createId(),
    projectId: '',
    type: 'item' as MaterialRequisitionFormValues['details'][0]['type'],
    itemOrServiceId: '',
    qty: 0,
    remarks: '',
    requestId: new Date().getTime(),
  },
];

export function RequisitionForm({
  products,
  projects,
  requisitionNo,
  services,
  requisition,
}: RequisitionFormProps) {
  const [submitType, setSubmitType] = useState<'SUBMIT' | 'SUBMIT_GENERATE'>(
    'SUBMIT'
  );
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<MaterialRequisitionFormValues>({
    resolver: zodResolver(materialRequisitionFormSchema),
    defaultValues: {
      documentNo: requisitionNo,
      documentDate: requisition?.documentDate
        ? new Date(requisition.documentDate)
        : new Date(),
      details:
        requisition?.mrqDetails.map(
          ({ id, itemId, projectId, qty, remarks, requestId, serviceId }) => ({
            id: id.toString(),
            projectId: projectId,
            type: itemId ? 'item' : 'service',
            itemOrServiceId: itemId || serviceId || '',
            qty: Number(qty) || 0,
            remarks: remarks || '',
            requestId: requestId || Date.now(),
          })
        ) || INITIAL_DETAILS,
    },
  });
  const { clearErrors, errors, onError } = useError();
  const isPending = form.formState.isSubmitting;
  async function onSubmit(data: MaterialRequisitionFormValues) {
    clearErrors();
    const res = await createRequisition({
      values: data,
      submitType,
      id: requisition?.reference,
    });
    if (res.error) {
      onError(res.message);
      return;
    }
  }

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      {errors && <CustomAlert description={errors} variant="error" />}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          ref={formRef}
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="documentNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document No</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={dateFormat(field.value)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <RequisitionDetails
            products={products}
            form={form}
            projects={projects}
            services={services}
            isPending={isPending}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              className="min-w-32"
              onClick={() => {
                setSubmitType('SUBMIT');
                formRef.current?.requestSubmit();
              }}
            >
              {isPending && submitType === 'SUBMIT' ? (
                <ButtonLoader loadingText="Processing..." />
              ) : (
                <>
                  <CircleCheckBigIcon />
                  <span>Save</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => {
                setSubmitType('SUBMIT_GENERATE');
                formRef.current?.requestSubmit();
              }}
              size="lg"
              disabled={isPending}
              className="min-w-32"
            >
              {isPending && submitType === 'SUBMIT_GENERATE' ? (
                <ButtonLoader loadingText="Processing..." />
              ) : (
                <>
                  <SparkleIcon />
                  <span>Save & Generate PO</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              type="reset"
              disabled={isPending}
              onClick={() => form.reset()}
              className="min-w-32"
            >
              <CircleXIcon />
              <span>Cancel</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function RequisitionDetails({
  products,
  projects,
  form,
  services,
  isPending,
}: {
  products: Array<Option>;
  projects: Array<Option>;
  services: Array<Option>;
  form: UseFormReturn<MaterialRequisitionFormValues>;
  isPending: boolean;
}) {
  const {
    products: queryProducts,
    services: queryServices,
    projects: queryProjects,
  } = useProcurementServices();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const [details] = useWatch({ control: form.control, name: ['details'] });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-4">
        <table
          className="w-full"
          style={{ minWidth: '1800px', tableLayout: 'fixed' }}
        >
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '224px' }}
              >
                Product/Service
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '480px' }}
              >
                Product
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Qty
              </th>
              <th
                className="text-left py-2 px-2 font-medium "
                style={{ width: '384px' }}
              >
                Project
              </th>
              <th
                className="text-left py-2 px-2 font-medium"
                style={{ width: '288px' }}
              >
                Remarks
              </th>
              <th
                className="text-centre py-2 px-2 font-medium"
                style={{ width: '128px' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, index) => (
              <tr key={f.id} className="border-b border-gray-200">
                <td className="py-2 px-2" style={{ width: '224px' }}>
                  <FormField
                    control={form.control}
                    name={`details.${index}.type`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <MiniSelect
                              defaultValue={field.value}
                              options={[
                                { value: 'item', label: 'Item' },
                                { value: 'service', label: 'Service' },
                              ]}
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '480px' }}>
                  <FormField
                    control={form.control}
                    name={`details.${index}.itemOrServiceId`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <SearchSelect
                            onChange={field.onChange}
                            value={field.value}
                            emptyText="Product not found"
                            placeholder="Select product"
                            isPending={isPending}
                            options={
                              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                              details[index]?.type === 'item'
                                ? queryProducts || products
                                : queryServices || services
                            }
                            searchText="Search product"
                          />

                          {/* <FormMessage /> */}
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '128px' }}>
                  <FormField
                    control={form.control}
                    name={`details.${index}.qty`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Qty"
                              {...field}
                              value={field.value || ''}
                              autoFocus={false}
                              className="w-full"
                              disabled={isPending}
                            />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '384px' }}>
                  <FormField
                    control={form.control}
                    name={`details.${index}.projectId`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <SearchSelect
                              onChange={field.onChange}
                              value={field.value}
                              emptyText="Project not found"
                              placeholder="Select project"
                              options={queryProjects || projects}
                              searchText="Search project"
                              isPending={isPending}
                            />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td className="py-2 px-2" style={{ width: '288px' }}>
                  <FormField
                    control={form.control}
                    name={`details.${index}.remarks`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Remarks"
                              {...field}
                              className="w-full"
                              disabled={isPending}
                            />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      );
                    }}
                  />
                </td>
                <td
                  className="py-2 px-2 text-center"
                  style={{ width: '128px' }}
                >
                  <Button
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => remove(index)}
                    type="button"
                    disabled={isPending}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="text-sm"
          type="button"
          onClick={() => append(INITIAL_DETAILS)}
          disabled={isPending}
        >
          Add lines
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => form.setValue('details', [])}
          type="button"
          disabled={isPending}
        >
          Clear all lines
        </Button>
      </div>
    </div>
  );
}
