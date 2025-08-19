import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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

export default async function EditProductPage({ params }: { params: Param }) {
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
    <div className="space-y-6">
      <FormHeader
        title="Edit Product"
        description={`Edit ${titleCase(product.productName)} details`}
      />
      <ProductsForm categories={categories} units={units} product={product} />
    </div>
  );
}
