import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { AutoOrdersForm } from '@/features/procurement/components/configure/auto-orders-form';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import db from '@/drizzle/db';

export const metadata: Metadata = {
  title: 'Configure Auto Orders',
};

export default async function ConfigureAutoOrdersPage() {
  const items = await db.query.autoOrdersItems.findMany();
  const [products, vendors] = await Promise.all([
    getSelectableProducts(),
    getActiveVendors(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Configure Auto Orders"
        description="Adjust your auto order settings and define reorder levels and quantities for products."
      />
      <AutoOrdersForm
        products={products}
        vendors={vendors}
        autoOrdersItems={items.map(item => ({
          ...item,
          reorderQty: +item.reorderQty,
          reorderLevel: +item.reorderLevel,
        }))}
      />
    </div>
  );
}
