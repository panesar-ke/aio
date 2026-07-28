import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import FormHeader from '@/components/custom/form-header';
import { AutoOrdersForm } from '@/features/procurement/components/configure/auto-orders-form';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import db from '@/drizzle/db';

export const metadata: Metadata = {
  title: 'Configure Auto Orders',
};

export default function ConfigureAutoOrdersPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Configure Auto Orders"
        description="Adjust your auto order settings and define reorder levels and quantities for products."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load auto-order configuration"
        loader={<FormLoader />}
      >
        <ConfigureAutoOrdersContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ConfigureAutoOrdersContent() {
  const items = await db.query.autoOrdersItems.findMany();
  const [products, vendors] = await Promise.all([
    getSelectableProducts(),
    getActiveVendors(),
  ]);

  return (
    <AutoOrdersForm
      products={products}
      vendors={vendors}
      autoOrdersItems={items.map(item => ({
        ...item,
        reorderQty: +item.reorderQty,
        reorderLevel: +item.reorderLevel,
      }))}
    />
  );
}
