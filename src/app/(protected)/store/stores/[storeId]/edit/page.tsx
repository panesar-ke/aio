import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { StoreForm } from '@/features/store/components/stores/store-form';
import { getStore } from '@/features/store/services/stores/data';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Edit Store',
};

type Params = Promise<{ storeId: string }>;

export default function EditStorePage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the store"
        loader={<FormLoader />}
      >
        <EditStoreContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditStoreContent({ params }: { params: Params }) {
  const { storeId } = await params;
  const store = await getStore(storeId);
  if (!store) return notFound();

  return (
    <>
      <FormHeader
        title="Edit Store"
        description={`Edit store ${titleCase(store.storeName)} details`}
      />
      <StoreForm store={store} />
    </>
  );
}
