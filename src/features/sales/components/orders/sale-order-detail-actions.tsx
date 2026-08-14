'use client';

import { BanIcon, PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type {
  SaleOrderDetailLine,
  SaleOrderDetails,
} from '@/features/sales/utils/sales.types';

import { PermissionGate } from '@/components/auth/client-permission-gate';
import { notify } from '@/components/custom/toast';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { SaleOrderDownloadButton } from '@/features/sales/components/orders/sale-order-download-button';
import { cancelSaleOrder } from '@/features/sales/services/orders/actions';
import { canEditDeleteSaleOrder } from '@/features/sales/utils/sale-order-permissions';

type SaleOrderDetailActionsProps = {
  order: SaleOrderDetails['order'];
  lines: Array<SaleOrderDetailLine>;
};

export function SaleOrderDetailActions({
  order,
  lines,
}: SaleOrderDetailActionsProps) {
  const router = useRouter();
  const canEditOrCancel = canEditDeleteSaleOrder(order.status);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <SaleOrderDownloadButton order={order} lines={lines} />

      <PermissionGate permissions={['sales:admin']}>
        {canEditOrCancel && (
          <>
            <Button type='button' variant='secondary' asChild>
              <Link prefetch={false} href={`/sales/orders/${order.id}/edit`}>
                <PencilIcon className='size-3.5' />
                Edit
              </Link>
            </Button>
            <ActionButton
              variant='outline'
              className='text-destructive hover:bg-destructive/10 hover:text-destructive'
              action={async () => cancelSaleOrder(order.id)}
              requireAreYouSure
              areYouSureDescription='Cancelling this sale order freezes it. It can no longer be edited - you will need to raise a new order instead.'
              onSuccess={() => {
                notify.success(
                  'Order cancelled',
                  'This sale order has been cancelled.',
                );
                router.refresh();
              }}
            >
              <BanIcon className='size-3.5' />
              Cancel Order
            </ActionButton>
          </>
        )}
      </PermissionGate>
    </div>
  );
}
