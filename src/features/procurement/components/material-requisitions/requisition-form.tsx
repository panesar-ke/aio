import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2Icon } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type {
  MaterialRequisitionFormValues,
  Requisition,
} from '@/features/procurement/utils/procurement.types'
import type { Option } from '@/types/index.types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { materialRequisitionFormSchema } from '@/features/procurement/utils/schemas'
import { Input } from '@/components/ui/input'
import { dateFormat } from '@/lib/helpers/formatters'
import { Button } from '@/components/ui/button'
import { MiniSelect } from '@/components/custom/mini-select'
import { SearchSelect } from '@/components/custom/search-select'
import FormActions from '@/components/custom/form-actions'
import { generateRandomId } from '@/lib/utils'
import { createRequisition } from '@/features/procurement/services/server-fns'
import { useError } from '@/hooks/use-error'
import { CustomAlert } from '@/components/custom/custom-alert'

interface RequisitionFormProps {
  requisitionNo: number
  projects: Array<Option>
  products: Array<Option>
  services: Array<Option>
  requisition?: Requisition
}

const INITIAL_DETAILS = [
  {
    id: generateRandomId('mrq'),
    projectId: '',
    type: 'item' as MaterialRequisitionFormValues['details'][0]['type'],
    itemOrServiceId: '',
    qty: 0,
    remarks: '',
    requestId: new Date().getTime(),
  },
]

export function RequisitionForm({
  products,
  projects,
  requisitionNo,
  services,
  requisition,
}: RequisitionFormProps) {
  const navigate = useNavigate()
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
            requestId: requestId || new Date().getTime(),
          }),
        ) || INITIAL_DETAILS,
    },
  })
  const { clearErrors, errors, onError } = useError()
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      values: MaterialRequisitionFormValues
      id?: string
    }) =>
      await createRequisition({ data: { values: data.values, id: data.id } }),
  })

  function onSubmit(data: MaterialRequisitionFormValues) {
    clearErrors()
    mutate(
      { values: data, id: requisition?.reference },
      {
        onSuccess: (ctx) => {
          if (ctx.error) {
            onError(ctx.message)
            return
          } else {
            form.reset()
            queryClient.invalidateQueries({
              queryKey: ['material_requisitions'],
            })
            navigate({
              to: '/procurement/material-requisition/$requisitionId/details',
              params: { requisitionId: ctx.data as string },
            })
          }
        },
        onError: (err) => {
          onError(err.message)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {errors && <CustomAlert description={errors} variant="error" />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          .
          <FormActions
            isPending={isPending}
            resetFn={() => form.reset()}
            className="w-full"
          />
        </form>
      </Form>
    </div>
  )
}

function RequisitionDetails({
  products,
  projects,
  form,
  services,
  isPending,
}: {
  products: Array<Option>
  projects: Array<Option>
  services: Array<Option>
  form: UseFormReturn<MaterialRequisitionFormValues>
  isPending: boolean
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  })

  const [details] = useWatch({ control: form.control, name: ['details'] })

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
                      )
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
                                ? products
                                : services
                            }
                            searchText="Search product"
                          />

                          {/* <FormMessage /> */}
                        </FormItem>
                      )
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
                      )
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
                              options={projects}
                              searchText="Search project"
                              isPending={isPending}
                            />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      )
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
                      )
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
  )
}
