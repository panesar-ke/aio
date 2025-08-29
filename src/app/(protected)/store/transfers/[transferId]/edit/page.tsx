import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { getStores } from '@/features/store/services/stores/data';
import { getTransfer } from '@/features/store/services/transfers/data';
import { TransferForm } from '@/features/store/components/transfers/transfer-form';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Edit Material Transfer',
};

export default async function EditTransferPage({
  params,
}: {
  params: Promise<{ transferId: string }>;
}) {
  const { transferId } = await params;
  const [products, stores, transfer] = await Promise.all([
    getSelectableProducts(),
    getStores(),
    getTransfer(transferId),
  ]);

  if (!transfer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit  Material Transfer`}
        description="Fill out the form below to edit the material transfer."
      />
      <TransferForm
        stores={transformOptions(
          stores.map(store => ({
            id: store.id,
            name: store.storeName.toUpperCase(),
          }))
        )}
        products={products}
        transfer={transfer}
      />
    </div>
  );
}
