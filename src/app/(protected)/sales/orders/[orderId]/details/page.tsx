import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { SaleOrderDetailPageContent } from '@/features/sales/components/orders/sale-order-detail-page';
import { getSaleOrderDetails } from '@/features/sales/services/orders/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sale Order Details',
};

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function SaleOrderDetailsPage({ params }: PageProps) {
  return (
    <ErrorBoundaryWithSuspense
      errorMessage='Unable to load sale order details.'
      loaderType='tableOnly'
    >
      <SuspendedSaleOrderDetails params={params} />
    </ErrorBoundaryWithSuspense>
  );
}

async function SuspendedSaleOrderDetails({ params }: PageProps) {
  const { orderId } = await params;
  const saleOrderId = Number(orderId);

  if (!Number.isInteger(saleOrderId) || saleOrderId < 1) {
    notFound();
  }

  const details = await getSaleOrderDetails(saleOrderId);

  if (!details) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <Button variant='link' asChild>
        <Link href='/sales/orders'>
          <ArrowLeftIcon className='size-4' />
          Back to Sale Orders
        </Link>
      </Button>
      <SaleOrderDetailPageContent details={details} />
    </div>
  );
}
