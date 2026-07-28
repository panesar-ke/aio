import type {
  OrderRegister,
  OrderRegisterFormValues,
  OrderRegisterWithValues,
} from '@/features/procurement/utils/procurement.types';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { OrderRegisterParamsForm } from '@/features/procurement/components/order-register/params-form';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import { orderRegisterReport } from '@/features/procurement/services/reports/data';
import { isEmptyObject } from '@/lib/utils';
import { ErrorNotification } from '@/components/custom/error-components';
import { ReportLoader } from '@/components/custom/loaders';
import {
  OrderDatatable,
  OrderRegisterByItemsDatatable,
} from '@/features/procurement/components/order-register/order-datatable';

export const metadata = {
  title: 'Order Register',
};

type SearchParams = Promise<{
  from: string;
  to: string;
  reportType: 'summary' | 'items';
  vendorId: string;
}>;

export default function OrderRegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Register"
        description="Review purchase orders across a selected date range."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Error loading order register data"
        loader={<ReportLoader />}
      >
        <OrderRegisterContent searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function OrderRegisterContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [vendors, params] = await Promise.all([
    getActiveVendors(),
    searchParams,
  ]);

  return (
    <>
      <OrderRegisterParamsForm vendors={vendors} />
      {!isEmptyObject(params) && (
        <ErrorBoundaryWithSuspense
          errorMessage="Error loading order register data"
          loader={<ReportLoader type="tableOnly" />}
        >
          <SuspendedOrderRegister searchParams={params} />
        </ErrorBoundaryWithSuspense>
      )}
    </>
  );
}

async function SuspendedOrderRegister({
  searchParams,
}: {
  searchParams: Partial<OrderRegisterFormValues>;
}) {
  const results = await orderRegisterReport(searchParams);

  if (results.error !== null) {
    return <ErrorNotification message={results.error} />;
  }

  if (searchParams.reportType === 'summary') {
    return <OrderDatatable data={results.data as Array<OrderRegister>} />;
  }

  return (
    <OrderRegisterByItemsDatatable
      data={results.data as Array<OrderRegisterWithValues>}
    />
  );
}
