'use client';
import { useMemo, useState, useCallback, useRef, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CircleCheckBigIcon,
  CircleXIcon,
  HourglassIcon,
  MailCheckIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  OrderFormValues,
  PendingOrder,
  Requisition,
  Order,
} from '@/features/procurement/utils/procurement.types';
import { orderSchema } from '@/features/procurement/utils/schemas';
import type { Option } from '@/types/index.types';
import { Form } from '@/components/ui/form';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/custom/datatable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ButtonLoader } from '@/components/custom/loaders';
import { OrderFormHeader } from '@/features/procurement/components/purchase-order/order-form-header';
import { OrderDetails } from '@/features/procurement/components/purchase-order/order-details';
import { OrderSummary } from '@/features/procurement/components/purchase-order/order-summary';
import {
  createOrder,
  deletePendingRequests,
} from '@/features/procurement/services/purchase-orders/actions';
import { ToastContent } from '@/components/custom/toast';

type RequisitionData = {
  documentDate: Date;
  details: Requisition['mrqDetails'];
};

interface OrderFormProps {
  orderNo: number;
  pendingOrders: Array<PendingOrder>;
  vendors: Array<Option>;
  services: Array<Option>;
  products: Array<Option>;
  projects: Array<Option>;
  requisitionData?: RequisitionData | null;
  order?: Order;
}

export function OrderForm({
  orderNo,
  pendingOrders,
  vendors = [],
  requisitionData,
  services = [],
  products = [],
  projects = [],
  order,
}: OrderFormProps) {
  const [submitType, setSubmitType] = useState<'SUBMIT' | 'SUBMIT_SEND'>(
    'SUBMIT'
  );
  const submitTypeRef = useRef<'SUBMIT' | 'SUBMIT_SEND'>('SUBMIT');
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      details:
        order?.ordersDetails.map(
          ({
            id,
            requestId,
            projectId,
            itemId,
            serviceId,
            qty,
            rate,
            discountType,
            discount,
          }) => ({
            id,
            requestId: requestId?.toString() || '',
            projectId,
            type: itemId ? 'item' : ('service' as const),
            itemOrServiceId: itemId || serviceId || undefined,
            qty: +qty,
            rate: parseFloat(rate),
            discountType: discountType || 'NONE',
            discount: discount ? parseFloat(discount) : 0,
          })
        ) ||
        requisitionData?.details.map(detail => ({
          id: detail.id,
          requestId: detail.requestId.toString(),
          projectId: detail.projectId,
          type: detail.itemId ? 'item' : ('service' as const),
          itemOrServiceId: detail.itemId || detail.serviceId || undefined,
          qty: +detail.qty,
          rate: detail.itemId
            ? +(detail.product?.buyingPrice ?? 0)
            : +(detail.service?.serviceFee ?? 0),
          discountType: 'NONE',
          discount: 0,
        })) ||
        [],
      documentDate: order?.documentDate
        ? new Date(order?.documentDate)
        : requisitionData?.documentDate
        ? new Date(requisitionData?.documentDate)
        : new Date(),
      displayOdometerDetails: false,
      vehicle: undefined,
      documentNo: orderNo,
      vendor: order?.vendor.id || '',
      invoiceNo: order?.billNo || '',
      vatType: order?.vatType || 'NONE',
      vat: order?.vatId ? order.vatId.toString() : '',
      invoiceDate: order?.billDate ? new Date(order?.billDate) : undefined,
    },
  });

  const { append } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const isPending = form.formState.isSubmitting;

  const handleFormSubmit = async (data: OrderFormValues) => {
    const res = await createOrder({
      values: data,
      submitType: submitTypeRef.current,
      id: order?.reference,
    });
    if (res.error) {
      toast.error(`Failed to create order: ${res.message}`);
      return;
    }
  };

  const handleAddPendingRequests = useCallback(
    (selectedRequests: Array<PendingOrder>) => {
      const newDetails = selectedRequests.map(request => ({
        id: request.id,
        requestId: request.requestId,
        projectId: request.projectId,
        type: request.type,
        itemOrServiceId:
          request.type === 'item'
            ? (request.itemId as string)
            : (request.serviceId as string),
        qty: Number(request.qty),
        rate: Number(request.rate) || 0,
        discountType: 'NONE' as const,
        discount: 0,
      }));
      newDetails.forEach(detail => append({ ...detail }));
      toast.success(
        `Added ${selectedRequests.length} pending requests to order`
      );
    },
    [append]
  );

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
          ref={formRef}
        >
          <OrderFormHeader form={form} vendors={vendors} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Order Details</h3>
              <div className="flex gap-2">
                <PendingRequests
                  pendingOrders={pendingOrders}
                  onAddSelected={handleAddPendingRequests}
                />
              </div>
            </div>
            <OrderDetails
              form={form}
              isPending={isPending}
              services={services}
              products={products}
              projects={projects}
            />
          </div>
          <div className="flex items-start justify-between gap-2">
            <OrderSummary form={form} />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="lg"
                disabled={isPending}
                className="min-w-32"
                onClick={() => {
                  submitTypeRef.current = 'SUBMIT';
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
                  submitTypeRef.current = 'SUBMIT_SEND';
                  setSubmitType('SUBMIT_SEND');
                  formRef.current?.requestSubmit();
                }}
                size="lg"
                disabled={isPending}
                className="min-w-32"
              >
                {isPending && submitType === 'SUBMIT_SEND' ? (
                  <ButtonLoader loadingText="Processing..." />
                ) : (
                  <>
                    <MailCheckIcon />
                    <span>Save & Send</span>
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
          </div>
        </form>
      </Form>
    </div>
  );
}

interface PendingRequestsProps {
  pendingOrders: Array<PendingOrder>;
  onAddSelected: (selectedRequests: Array<PendingOrder>) => void;
}

function PendingRequests({
  pendingOrders,
  onAddSelected,
}: PendingRequestsProps) {
  const [selectedRows, setSelectedRows] = useState<Array<PendingOrder>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<PendingOrder>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => {
              table.toggleAllPageRowsSelected(!!value);
              setSelectedRows(value ? pendingOrders : []);
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const mrq = row.original;
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => {
                const isSelected = !!value;
                setSelectedRows(prev => {
                  const selected = prev.some(req => req.id === mrq.id);
                  if (isSelected && !selected) {
                    return [...prev, mrq];
                  }
                  if (!isSelected && selected) {
                    return prev.filter(req => req.id !== mrq.id);
                  }
                  return prev;
                });
                row.toggleSelected(isSelected);
              }}
              aria-label="Select row"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'itemName',
        header: 'Product Name',
        cell: ({ row }) => (
          <div className="font-medium uppercase">
            {row.getValue('itemName')}
          </div>
        ),
      },
      {
        accessorKey: 'qty',
        header: 'Qty',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue('qty')}</Badge>
        ),
      },
    ],
    [pendingOrders]
  );

  const handleAddSelected = useCallback(() => {
    if (selectedRows.length > 0) {
      onAddSelected(selectedRows);
      setSelectedRows([]);
      setIsOpen(false);
    }
  }, [selectedRows, onAddSelected]);

  const handleDeleteSelected = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await deletePendingRequests(
          selectedRows.map(row => row.requestId)
        );

        if (result.error) {
          toast.error(() => (
            <ToastContent title="Error" message={result.message} />
          ));
          return;
        }
      } catch (error) {
        console.error('Error updating user rights:', error);
        toast.error(() => (
          <ToastContent
            title="Error"
            message="There was a problem while performing this action."
          />
        ));
      }
    });
    console.log('Delete selected:', selectedRows);
  }, [selectedRows]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" type="button">
          <HourglassIcon className="h-4 w-4 mr-2" />
          Pending Requests
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingOrders.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-3xl">
        <ScrollArea className="h-full">
          <SheetHeader className="pb-4">
            <SheetTitle>Pending Requests</SheetTitle>
            <SheetDescription>
              Select pending requests to add to your purchase order.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedRows.length} of {pendingOrders.length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={selectedRows.length === 0 || isPending}
                  onClick={handleAddSelected}
                  size="sm"
                >
                  Add Selected ({selectedRows.length})
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={selectedRows.length === 0 || isPending}
                  onClick={handleDeleteSelected}
                  size="sm"
                >
                  Delete Selected
                </Button>
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRows([])}
                  >
                    Cancel
                  </Button>
                </SheetClose>
              </div>
            </div>

            {pendingOrders.length > 0 ? (
              <DataTable
                columns={columns}
                data={pendingOrders}
                // enableRowSelection
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending requests available
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
