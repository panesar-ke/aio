import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import { getProducts } from '@/features/procurement/services/products/data';
import { ProductsDataTable } from '@/features/procurement/components/products/products-datatable';

type SearchParams = Promise<{ search?: string }>;

export const metadata: Metadata = {
  title: 'Products',
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Create and Manage your products."
        path="/procurement/products/new"
      />
      <Search placeholder="Search products..." />
      <ErrorBoundary
        fallback={<div className="text-red-500">Failed to load products</div>}
      >
        <Suspense
          fallback={
            <TableSkeleton
              columnWidths={['w-24', 'w-24', 'w-56', 'w-1']}
              rowCount={10}
            />
          }
        >
          <SuspendedProducts searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

async function SuspendedProducts({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search } = await searchParams;
  const products = await getProducts(search);
  return <ProductsDataTable products={products} />;
}
