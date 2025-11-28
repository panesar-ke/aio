import FormHeader from '@/components/custom/form-header';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { ConversionForm } from '@/features/store/components/conversion/conversion-form';
import { getMainStore } from '@/features/store/services/stores/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Material Conversion',
};

export default async function ConversionPage() {
  const [products, mainStore] = await Promise.all([
    getSelectableProducts(),
    getMainStore(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Material Conversion"
        description="Convert materials to smaller components."
      />
      <ConversionForm products={products} mainStore={mainStore} />
    </div>
  );
}
