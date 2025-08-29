import FormHeader from '@/components/custom/form-header';
import { TransferForm } from '@/features/store/components/transfers/transfer-form';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { getStores } from '@/features/store/services/stores/data';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata = {
  title: 'Create New Transfer',
};

export default async function NewTransferPage() {
  const [products, stores] = await Promise.all([
    getSelectableProducts(),
    getStores(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create New Transfer"
        description="Fill in the details to create a new transfer."
      />
      <TransferForm
        stores={transformOptions(
          stores.map(store => ({
            id: store.id,
            name: store.storeName.toUpperCase(),
          }))
        )}
        products={products}
      />
    </div>
  );
}
