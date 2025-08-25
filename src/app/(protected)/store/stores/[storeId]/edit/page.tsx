import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { StoreForm } from '@/features/store/components/stores/store-form';
import { getStore } from '@/features/store/services/stores/data';
import { notFound } from 'next/navigation';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Edit Store',
};

type Params = Promise<{ storeId: string }>;

export default async function EditStorePage({ params }: { params: Params }) {
  const { storeId } = await params;
  const store = await getStore(storeId);
  if (!store) return notFound();
  return (
    <div className="space-y-6">
      <FormHeader
        title="Edit Store"
        description={`Edit store ${titleCase(store.storeName)} details`}
      />
      <StoreForm store={store} />
    </div>
  );
}
