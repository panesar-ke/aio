import { connection } from 'next/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { TransferForm } from '@/features/store/components/transfers/transfer-form';
import { getStores } from '@/features/store/services/stores/data';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata = {
  title: 'Create New Transfer',
};

export default function NewTransferPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create New Transfer"
        description="Fill in the details to create a new transfer."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the transfer form"
        loader={<FormLoader />}
      >
        <NewTransferContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewTransferContent() {
  await connection();
  const [products, stores] = await Promise.all([
    getSelectableProducts(),
    getStores(),
  ]);

  return (
    <TransferForm
      defaultTransferDate={new Date().toISOString()}
      stores={transformOptions(
        stores.map(store => ({
          id: store.id,
          name: store.storeName.toUpperCase(),
        }))
      )}
      products={products}
    />
  );
}
