"use client";
import { useSelector } from "@tanstack/react-store";
import { CircleXIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

import type {
  Order,
  PendingOrder,
} from "@/features/procurement/utils/procurement.types";
import type { Option } from "@/types/index.types";

import { ToastContent } from "@/components/custom/toast";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { OrderDetails } from "@/features/procurement/components/purchase-order/order-details";
import {
  buildOrderFormDefaultValues,
  getOrderFormSeedKey,
  type OrderFormRequisitionData,
} from "@/features/procurement/components/purchase-order/order-form-defaults";
import { OrderFormHeader } from "@/features/procurement/components/purchase-order/order-form-header";
import {
  calculateOrderSummary,
  OrderSummary,
} from "@/features/procurement/components/purchase-order/order-summary";
import { createOrder } from "@/features/procurement/services/purchase-orders/actions";
import { purchaseOrderFormOpts } from "@/features/procurement/utils/form";
import { useAppForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";
import { numberFormat } from "@/lib/helpers/formatters";

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
  const router = useRouter();
  const isEdit = !!order;

  const defaultValues = useMemo(
    () =>
      buildOrderFormDefaultValues({
        order,
        orderNo,
        requisitionData,
      }),
    [order, orderNo, requisitionData],
  );
  const seedKey = useMemo(
    () =>
      getOrderFormSeedKey({
        order,
        orderNo,
        requisitionData,
      }),
    [order, orderNo, requisitionData],
  );

  const formOpts = useMemo(
    () => purchaseOrderFormOpts(orderNo, defaultValues),
    [orderNo, defaultValues],
  );
  const appForm = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      if (value.details.length === 0) {
        toast.error(() => (
          <ToastContent
            title="Validation Error"
            message="At least one item is required"
          />
        ));
        return;
      }

      await handleSubmitFeedback({
        action: () => createOrder({ values: value, id: order?.reference }),
        errorTitle: `Error ${isEdit ? "updating" : "creating"} order`,
        successTitle: `✅ ${isEdit ? "Updated" : "Created"}`,
        fallbackMessage: `Failed to ${isEdit ? "update" : "create"} order. Please try again.`,
        onSuccess: (data) => {
          appForm.reset();
          router.push(
            data
              ? `/procurement/purchase-order/${data}/details`
              : "/procurement/purchase-order",
          );
        },
      });
    },
  });

  useEffect(() => {
    appForm.reset();
  }, [appForm]);

  const lastSeedKey = useRef(seedKey);
  useEffect(() => {
    if (lastSeedKey.current === seedKey) {
      return;
    }

    appForm.reset(defaultValues);
    lastSeedKey.current = seedKey;
  }, [appForm, defaultValues, seedKey]);

  const isSubmitting = useSelector(
    appForm.store,
    (state) => state.isSubmitting,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          appForm.handleSubmit();
        }}
        className="flex-1 space-y-6 overflow-y-auto pb-6"
      >
        <OrderFormHeader form={appForm} vendors={vendors} />
        <OrderDetails
          form={appForm}
          products={products}
          projects={projects}
          services={services}
          pendingOrders={pendingOrders}
        />
        <OrderSummary form={appForm} />
      </form>
      <footer className="sticky bottom-0 z-10 border-t bg-background">
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <appForm.Subscribe
            selector={(state) => {
              const { details, vatType, vat } = state.values;
              return {
                lineCount: details.length,
                total: calculateOrderSummary({ details, vatType, vat })
                  .inclusive,
              };
            }}
          >
            {({ lineCount, total }) => (
              <p className="text-xs text-muted-foreground">
                {lineCount} {lineCount === 1 ? "line" : "lines"} &mdash; Ksh{" "}
                {numberFormat(total)}
              </p>
            )}
          </appForm.Subscribe>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => appForm.reset()}
              className="min-w-32"
            >
              <CircleXIcon />
              <span>Cancel</span>
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={isSubmitting}
              onClick={() => appForm.handleSubmit()}
              className="min-w-32"
            >
              <LoadingSwap
                isLoading={isSubmitting}
                className="flex items-center gap-2"
              >
                <SaveIcon />
                <span>Save Purchase Order</span>
              </LoadingSwap>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
