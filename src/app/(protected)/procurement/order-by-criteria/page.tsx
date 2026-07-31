import type {
  OrderByCriteriaFormValues,
  OrderByCriteriaProduct,
  OrderByCriteriaProject,
} from '@/features/procurement/utils/procurement.types';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { ErrorNotification } from '@/components/custom/error-components';
import { ReportLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { OrderByCriteriaParamsForm } from '@/features/procurement/components/order-by-criteria/form';
import {
  OrderByCriteriaProductTable,
  OrderByCriteriaProjectTable,
} from '@/features/procurement/components/order-by-criteria/order-by-criteria-datatables';
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/material-requisitions/data';
import { orderByCriteria } from '@/features/procurement/services/reports/data';
import { isEmptyObject } from '@/lib/utils';

export const metadata = {
  title: 'Order by Criteria',
};

type SearchParams = Promise<{
  from: string;
  to: string;
  criteria: 'product' | 'project' | 'service';
  option: string;
}>;

export default function OrderByCriteriaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Order by Criteria"
        description="View and manage orders based on specific criteria."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Error loading order-by-criteria data"
        loader={<ReportLoader />}
      >
        <OrderByCriteriaContent searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function OrderByCriteriaContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [projects, products, services, params] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    searchParams,
  ]);

  return (
    <>
      <OrderByCriteriaParamsForm
        products={products}
        projects={projects}
        services={services}
      />
      {!isEmptyObject(params) && (
        <ErrorBoundaryWithSuspense
          errorMessage="Error loading order register data"
          loader={<ReportLoader type="tableOnly" />}
        >
          <SuspendedOrderByCriteria searchParams={params} />
        </ErrorBoundaryWithSuspense>
      )}
    </>
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
