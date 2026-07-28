'use client';
import type { ColumnDef } from '@tanstack/react-table';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircleCheckBigIcon,
  CircleXIcon,
  HourglassIcon,
  MailCheckIcon,
} from 'lucide-react';
import {
  type BaseSyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type {
  Order,
  OrderFormValues,
  PendingOrder,
} from '@/features/procurement/utils/procurement.types';
import type { Option } from '@/types/index.types';

import { DataTable } from '@/components/custom/datatable';
import { ButtonLoader } from '@/components/custom/loaders';
import { ToastContent } from '@/components/custom/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { OrderDetails } from '@/features/procurement/components/purchase-order/order-details';
import {
  buildOrderFormDefaultValues,
  getOrderFormSeedKey,
  type OrderFormRequisitionData,
} from '@/features/procurement/components/purchase-order/order-form-defaults';
import { OrderFormHeader } from '@/features/procurement/components/purchase-order/order-form-header';
import { OrderSummary } from '@/features/procurement/components/purchase-order/order-summary';
import {
  createOrder,
  deletePendingRequests,
} from '@/features/procurement/services/purchase-orders/actions';
import { orderSchema } from '@/features/procurement/utils/schemas';

interface OrderFormProps {
  orderNo: number;
  pendingOrders: Array<PendingOrder>;
  vendors: Array<Option>;
  services: Array<Option>;
  products: Array<Option>;
  projects: Array<Option>;
  requisitionData?: OrderFormRequisitionData | null;
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
  const defaultValues = useMemo(
    () =>
      buildOrderFormDefaultValues({
        order,
        orderNo,
        requisitionData,
      }),
    [order, orderNo, requisitionData]
  );
  const seedKey = useMemo(
    () =>
      getOrderFormSeedKey({
        order,
        orderNo,
        requisitionData,
      }),
    [order, orderNo, requisitionData]
  );
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues,
  });
  const lastSeedKey = useRef(seedKey);

  useEffect(() => {
    if (lastSeedKey.current === seedKey) {
      return;
    }

    form.reset(defaultValues);
    lastSeedKey.current = seedKey;
  }, [defaultValues, form, seedKey]);

  const { append } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const isPending = form.formState.isSubmitting;

  const handleFormSubmit = async (
    data: OrderFormValues,
    event?: BaseSyntheticEvent
  ) => {
    const submitter =
      event?.nativeEvent instanceof SubmitEvent
        ? event.nativeEvent.submitter
        : null;
    const nextSubmitType =
      submitter instanceof HTMLButtonElement &&
      submitter.value === 'SUBMIT_SEND'
        ? 'SUBMIT_SEND'
        : 'SUBMIT';

    setSubmitType(nextSubmitType);
    const res = await createOrder({
      values: data,
      submitType: nextSubmitType,
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
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                type="submit"
                value="SUBMIT"
                size="lg"
                disabled={isPending}
                className="min-w-32"
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
                type="submit"
                value="SUBMIT_SEND"
                variant="tertiary"
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

  const columns: Array<ColumnDef<PendingOrder>> = useMemo(
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
    startTransition(() => {
      const ids = selectedRows.map(row => String(row.requestId));
      deletePendingRequests(ids)
        .then(result => {
          if (result.error) {
            toast.error(() => (
              <ToastContent title="Error" message={result.message} />
            ));
            return;
          }

          toast.success(() => (
            <ToastContent
              title="Success"
              message={`Deleted ${ids.length} pending request(s).`}
            />
          ));
        })
        .catch(error => {
          console.error('Error deleting pending requests:', error);
          toast.error(() => (
            <ToastContent
              title="Error"
              message="There was a problem while performing this action."
            />
          ));
        });
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
