import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { SalesOrderForm } from '@/features/sales/components/orders/sales-order-form';
import { getAccounts } from '@/features/sales/services/accounts/data';
import { getNextSaleOrderNoPreview } from '@/features/sales/services/orders/data';
import { AccountTier } from '@/features/sales/utils/search-params';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'New Sale Order',
};

export default async function NewSaleOrderPage() {
  return (
    <div className='space-y-6'>
      <FormHeader
        title='Create a New Sales Order'
        description='Fill in the details below to create a new sales order.'
      />
      <ErrorBoundaryWithSuspense loader={<FormLoader />}>
        <SuspendedSalesOrder />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedSalesOrder() {
  const [accounts, saleOrderNoPreview] = await Promise.all([
    getAccounts({
      lastPurchase: null,
      search: '',
      tier: AccountTier.all,
    }),
    getNextSaleOrderNoPreview(),
  ]);
  return (
    <SalesOrderForm
      accounts={accounts.map((a) => ({
        value: a.id,
        label: titleCase(a.company.toLowerCase()),
      }))}
      saleOrderPreviewNo={saleOrderNoPreview}
    />
  );
}
