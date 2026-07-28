import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import FormHeader from '@/components/custom/form-header';
import { ProductsForm } from '@/features/procurement/components/products/products-form';
import {
  getCategories,
  getProductUoms,
} from '@/features/procurement/services/products/data';

export const metadata: Metadata = {
  title: 'Create Product',
};
export default function CreateProductPage() {
  return (
    <div className="space-y-6">
      <FormHeader title="Create Product" description="Create a new product" />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the product form"
        loader={<FormLoader />}
      >
        <CreateProductContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function CreateProductContent() {
  const [categories, units] = await Promise.all([
    getCategories(),
    getProductUoms(),
  ]);

  return <ProductsForm categories={categories} units={units} />;
}
