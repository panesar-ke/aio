import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorNotification } from '@/components/custom/error-components';
import PageHeader from '@/components/custom/page-header';
import { OrderByCriteriaParamsForm } from '@/features/procurement/components/order-by-criteria/form';
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/material-requisitions/data';
import { isEmptyObject } from '@/lib/utils';
import { ReportLoader } from '@/components/custom/loaders';
import type {
  OrderByCriteriaFormValues,
  OrderByCriteriaProduct,
  OrderByCriteriaProject,
} from '@/features/procurement/utils/procurement.types';
import { orderByCriteria } from '@/features/procurement/services/reports/data';
import {
  OrderByCriteriaProductTable,
  OrderByCriteriaProjectTable,
} from '@/features/procurement/components/order-by-criteria/order-by-criteria-datatables';

export const metadata = {
  title: 'Order by Criteria',
};

type SearchParams = Promise<{
  from: string;
  to: string;
  criteria: 'product' | 'project' | 'service';
  option: string;
}>;

export default async function OrderByCriteriaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [projects, products, services] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Order by Criteria"
        description="View and manage orders based on specific criteria."
      />
      <OrderByCriteriaParamsForm
        products={products}
        projects={projects}
        services={services}
      />
      {!isEmptyObject(params) && (
        <ErrorBoundary
          fallback={
            <ErrorNotification message="Error loading order register data" />
          }
        >
          <Suspense fallback={<ReportLoader type="tableOnly" />}>
            <SuspendedOrderByCriteria searchParams={params} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

async function SuspendedOrderByCriteria({
  searchParams,
}: {
  searchParams: Partial<OrderByCriteriaFormValues>;
}) {
  const results = await orderByCriteria(searchParams);

  if (results.error !== null) {
    return <ErrorNotification message={results.error} />;
  }

  if (searchParams.criteria === 'project') {
    return (
      <OrderByCriteriaProjectTable
        data={results.data as Array<OrderByCriteriaProject>}
      />
    );
  }

  return (
    <OrderByCriteriaProductTable
      data={results.data as Array<OrderByCriteriaProduct>}
    />
  );
}
