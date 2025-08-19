import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { ProductsForm } from '@/features/procurement/components/products/products-form';
import {
  getCategories,
  getProductUoms,
} from '@/features/procurement/services/products/data';

export const metadata: Metadata = {
  title: 'Create Product',
};
export default async function CreateProductPage() {
  const [categories, units] = await Promise.all([
    getCategories(),
    getProductUoms(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader title="Create Product" description="Create a new product" />
      <ProductsForm categories={categories} units={units} />
    </div>
  );
}
