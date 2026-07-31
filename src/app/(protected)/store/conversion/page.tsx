import type { Metadata } from 'next';

import { connection } from 'next/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { ConversionForm } from '@/features/store/components/conversion/conversion-form';
import { getMainStore } from '@/features/store/services/stores/data';

export const metadata: Metadata = {
  title: 'Material Conversion',
};

export default function ConversionPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Material Conversion"
        description="Convert materials to smaller components."
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the conversion form"
        loader={<FormLoader />}
      >
        <ConversionContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ConversionContent() {
  await connection();
  const [products, mainStore] = await Promise.all([
    getSelectableProducts(),
    getMainStore(),
  ]);

  return (
    <ConversionForm
      defaultConversionDate={new Date().toISOString()}
      products={products}
      mainStore={mainStore}
    />
  );
}
