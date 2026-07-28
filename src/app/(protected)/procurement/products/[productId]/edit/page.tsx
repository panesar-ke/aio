import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import FormHeader from '@/components/custom/form-header';
import { ProductsForm } from '@/features/procurement/components/products/products-form';
import {
  getCategories,
  getProductUoms,
  getProduct,
} from '@/features/procurement/services/products/data';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Edit Product',
};

type Param = Promise<{ productId: string }>;

export default function EditProductPage({ params }: { params: Param }) {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the product"
        loader={<FormLoader />}
      >
        <EditProductContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditProductContent({ params }: { params: Param }) {
  const { productId } = await params;
  const [categories, units, product] = await Promise.all([
    getCategories(),
    getProductUoms(),
    getProduct(productId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <FormHeader
        title="Edit Product"
        description={`Edit ${titleCase(product.productName)} details`}
      />
      <ProductsForm categories={categories} units={units} product={product} />
    </>
  );
}
