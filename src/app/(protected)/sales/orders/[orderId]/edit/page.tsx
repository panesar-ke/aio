import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { SalesOrderForm } from '@/features/sales/components/orders/sales-order-form';
import { getAccounts } from '@/features/sales/services/accounts/data';
import { getSaleOrder } from '@/features/sales/services/orders/data';
import { canEditDeleteSaleOrder } from '@/features/sales/utils/sale-order-permissions';
import { AccountTier } from '@/features/sales/utils/search-params';
import { titleCase } from '@/lib/helpers/formatters';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit Sale Order',
};

// type PageProps = {
//   params: Promise<{ orderId: string }>;
// };

export default async function EditSaleOrderPage({
  params,
}: Pick<PageProps<'/sales/orders/[orderId]/edit'>, 'params'>) {
  return (
    <div className='space-y-6'>
      <FormHeader
        title='Edit Sales Order'
        description='Update the customer, document details and lines on this order.'
      />
      <ErrorBoundaryWithSuspense
        errorMessage='Unable to load sale order!'
        loader={<FormLoader />}
      >
        <SuspendedEditSaleOrder params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedEditSaleOrder({
  params,
}: Pick<PageProps<'/sales/orders/[orderId]/edit'>, 'params'>) {
  await requirePermission('sales:admin', { mode: 'page' });
  const { orderId } = await params;
  const saleOrderId = Number(orderId);

  if (!Number.isInteger(saleOrderId) || saleOrderId < 1) {
    notFound();
  }

  const [accounts, order] = await Promise.all([
    getAccounts({ lastPurchase: null, search: '', tier: AccountTier.all }),
    getSaleOrder(saleOrderId),
  ]);

  if (!order) {
    notFound();
  }

  if (!canEditDeleteSaleOrder(order.status)) {
    redirect(`/sales/orders/${saleOrderId}/details`);
  }

  return (
    <SalesOrderForm
      accounts={accounts.map((a) => ({
        value: a.id,
        label: titleCase(a.company.toLowerCase()),
      }))}
      saleOrderPreviewNo={order.saleOrderNo}
      order={order.values}
    />
  );
}
