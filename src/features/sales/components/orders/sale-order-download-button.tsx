'use client';

import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';

import type {
  SaleOrderDetailLine,
  SaleOrderDetails,
} from '@/features/sales/utils/sales.types';

import { notify } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { formatSaleOrderNo } from '@/features/sales/utils/sale-order-format';

type SaleOrderDownloadButtonProps = {
  order: SaleOrderDetails['order'];
  lines: Array<SaleOrderDetailLine>;
};

export function SaleOrderDownloadButton({
  order,
  lines,
}: SaleOrderDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);

    try {
      // @react-pdf/renderer is a large dependency and only ever needed when
      // somebody actually asks for the file, so it stays out of the page
      // bundle behind this dynamic import.
      const [{ pdf }, { SaleOrderPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/features/sales/components/orders/sale-order-pdf-document'),
      ]);

      const blob = await pdf(
        <SaleOrderPdfDocument order={order} lines={lines} />,
      ).toBlob();

      const fileName = `${formatSaleOrderNo(
        order.saleOrderNo,
        order.dateRaised,
      ).replaceAll('/', '-')}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate sale order PDF:', error);
      notify.error(
        'Download failed',
        'Could not generate the PDF. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      type='button'
      variant='outline'
      onClick={handleDownload}
      disabled={isGenerating}
    >
      <LoadingSwap isLoading={isGenerating} className='flex items-center gap-2'>
        <DownloadIcon className='size-3.5' />
        Download PDF
      </LoadingSwap>
    </Button>
  );
}
