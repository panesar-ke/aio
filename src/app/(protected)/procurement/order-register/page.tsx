import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type {
  OrderRegister,
  OrderRegisterFormValues,
  OrderRegisterWithValues,
} from '@/features/procurement/utils/procurement.types';
import PageHeader from '@/components/custom/page-header';
import { OrderRegisterParamsForm } from '@/features/procurement/components/order-register/params-form';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import { orderRegisterReport } from '@/features/procurement/services/reports/data';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';
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

export default async function OrderRegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const vendors = await getActiveVendors();
  const params = await searchParams;
  const { from, to, vendorId } = params;

  const vendorName =
    vendorId === 'all'
      ? 'All Vendors'
      : vendors.find(v => v.value === vendorId)?.label || 'Unknown Vendor';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Register"
        description={
          from &&
          `Order register for ${titleCase(vendorName)} between ${dateFormat(
            from,
            'long'
          )} and ${dateFormat(to, 'long')}`
        }
      />
      <OrderRegisterParamsForm vendors={vendors} />
      {!isEmptyObject(params) && (
        <ErrorBoundary
          fallback={
            <ErrorNotification message="Error loading order register data" />
          }
        >
          <Suspense fallback={<ReportLoader type="tableOnly" />}>
            <SuspendedOrderRegister searchParams={params} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
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
