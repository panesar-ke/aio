import type { ReactNode } from 'react';

import { format } from 'date-fns';
import { TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';

import type { SaleOrderDetails } from '@/features/sales/utils/sales.types';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SaleOrderDetailActions } from '@/features/sales/components/orders/sale-order-detail-actions';
import {
  formatSaleOrderAmount,
  formatSaleOrderNo,
} from '@/features/sales/utils/sale-order-format';
import {
  saleOrderStatusLabel,
  saleOrderStatusVariant,
} from '@/features/sales/utils/sale-order-permissions';
import { summariseSaleOrder } from '@/features/sales/utils/sale-order-summary';
import { dateFormat, numberFormat, titleCase } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

const VAT_TYPE_LABELS = {
  NONE: 'None',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
} as const;

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-medium text-muted-foreground'>{label}</span>
      <span
        className={cn(
          'text-sm font-medium text-foreground',
          mono && 'font-mono tracking-[0.02em]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ContextItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-[10px] font-semibold tracking-[0.04em] text-muted-foreground uppercase'>
        {label}
      </span>
      <span
        className={cn(
          'text-[13px] font-medium text-foreground',
          mono && 'font-mono tracking-[0.02em]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  isTotal,
}: {
  label: string;
  value: ReactNode;
  isTotal?: boolean;
}) {
  return (
    <div className='flex items-center justify-between border-b border-border/50 py-2.5 text-sm last:border-b-0'>
      <span
        className={cn(
          'text-muted-foreground',
          isTotal && 'font-semibold text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-medium tabular-nums',
          isTotal && 'text-base font-bold text-primary',
        )}
      >
        {value}
      </span>
    </div>
  );
}

const headerCellClass =
  'whitespace-nowrap border-b bg-muted px-3 py-2 text-left text-[11px] font-semibold tracking-[0.045em] text-muted-foreground uppercase';

export function SaleOrderDetailPageContent({
  details,
}: {
  details: SaleOrderDetails;
}) {
  const { order, lines } = details;
  const summary = summariseSaleOrder(order, lines);
  const orderNo = formatSaleOrderNo(order.saleOrderNo, order.dateRaised);
  const company = order.company ? titleCase(order.company.toLowerCase()) : '—';
  const isCancelled = order.status === 'cancelled';
  const money = (value: number) => formatSaleOrderAmount(order.currency, value);

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-xl font-semibold tracking-[-0.01em] text-foreground'>
              {orderNo}
            </h1>
            <Badge
              variant={saleOrderStatusVariant(order.status)}
              className='rounded-full px-2.5 py-1 text-[11px]'
            >
              {saleOrderStatusLabel(order.status)}
            </Badge>
          </div>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Raised {dateFormat(order.dateRaised, 'long')} for {company}.
          </p>
        </div>
        <SaleOrderDetailActions order={order} lines={lines} />
      </div>

      {isCancelled && (
        <div className='flex items-start gap-2.5 rounded-[1.125rem] border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-sm text-destructive'>
          <TriangleAlertIcon
            className='mt-0.5 size-4 shrink-0'
            aria-hidden='true'
          />
          <div>
            <p className='font-semibold'>This order was cancelled</p>
            <p className='opacity-90'>
              {order.cancelledAt
                ? `Cancelled on ${format(order.cancelledAt, 'dd MMM yyyy')}`
                : 'Cancelled'}
              {order.cancelledByName
                ? ` by ${titleCase(order.cancelledByName.toLowerCase())}`
                : ''}
              . No further edits are allowed — raise a new order if you need to.
            </p>
          </div>
        </div>
      )}

      <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
        <CardHeader className='border-b px-5 py-4'>
          <CardTitle className='text-sm'>Order Header</CardTitle>
          <CardDescription>
            Customer and document details for this order.
          </CardDescription>
        </CardHeader>
        <CardContent className='px-5 py-5'>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            <ReadOnlyField label='Order No.' value={orderNo} mono />
            <ReadOnlyField
              label='Order Date'
              value={dateFormat(order.dateRaised, 'reporting')}
            />
            <ReadOnlyField
              label='Account'
              value={
                order.accountId ? (
                  <Link
                    prefetch={false}
                    href={`/sales/accounts/${order.accountId}/details`}
                    className='text-info-foreground hover:underline'
                  >
                    {company}
                  </Link>
                ) : (
                  company
                )
              }
            />
            <ReadOnlyField
              label='VAT Type'
              value={VAT_TYPE_LABELS[order.vatType]}
            />
            <ReadOnlyField
              label='VAT Rate'
              value={
                order.vatType === 'NONE' ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  `${numberFormat(order.vatRate, 0)}%`
                )
              }
            />
            <ReadOnlyField label='Currency' value={order.currency} />
            <ReadOnlyField
              label='Exchange Rate'
              value={numberFormat(order.conversionRate)}
            />
          </div>

          <div className='mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 rounded-lg bg-muted/50 px-4 py-3'>
            <ContextItem label='KRA PIN' value={order.kraPin ?? '—'} mono />
            <ContextItem label='Phone' value={order.phone ?? '—'} />
            <ContextItem
              label='Email'
              value={
                order.email ? (
                  <a
                    href={`mailto:${order.email}`}
                    className='text-info-foreground hover:underline'
                  >
                    {order.email}
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
        <CardHeader className='border-b px-5 py-4'>
          <CardTitle className='text-sm'>Order Lines</CardTitle>
          <CardDescription>Items included in this order.</CardDescription>
        </CardHeader>
        <CardContent className='px-0 py-0'>
          <div className='overflow-x-auto'>
            <table
              aria-label='Sales order line items'
              className='w-full border-collapse'
            >
              <thead>
                <tr>
                  <th className={cn(headerCellClass, 'w-10 text-center')}>#</th>
                  <th className={cn(headerCellClass, 'min-w-44')}>Item</th>
                  <th className={cn(headerCellClass, 'w-20 text-right')}>
                    Qty
                  </th>
                  <th className={cn(headerCellClass, 'w-28 text-right')}>
                    Rate
                  </th>
                  <th className={cn(headerCellClass, 'w-32 text-right')}>
                    Gross
                  </th>
                  <th
                    className={cn(
                      headerCellClass,
                      'hidden min-w-32 sm:table-cell',
                    )}
                  >
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className='border-b last:border-b-0'>
                    <td className='px-3 py-2.5 text-center text-sm text-muted-foreground'>
                      {index + 1}
                    </td>
                    <td className='px-3 py-2.5 text-sm font-medium'>
                      {line.item}
                    </td>
                    <td className='px-3 py-2.5 text-right text-sm tabular-nums'>
                      {numberFormat(line.qty, 0)}
                    </td>
                    <td className='px-3 py-2.5 text-right text-sm tabular-nums'>
                      {numberFormat(line.rate)}
                    </td>
                    <td className='px-3 py-2.5 text-right text-sm font-semibold tabular-nums'>
                      {numberFormat(line.amount)}
                    </td>
                    <td className='hidden px-3 py-2.5 sm:table-cell'>
                      {line.category ? (
                        <Badge variant='secondary' className='rounded-full'>
                          {titleCase(line.category)}
                        </Badge>
                      ) : (
                        <span className='text-sm text-muted-foreground'>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
        <CardHeader className='border-b px-5 py-4'>
          <CardTitle className='text-sm'>Summary</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-x-8 px-5 py-3 sm:grid-cols-3'>
          <div>
            <SummaryRow
              label='Total Items'
              value={numberFormat(summary.totalItems, 0)}
            />
            <SummaryRow
              label='Lines'
              value={numberFormat(summary.lineCount, 0)}
            />
          </div>
          <div>
            <SummaryRow label='Gross Value' value={money(summary.grossTotal)} />
            <SummaryRow label='VAT' value={money(summary.vatAmount)} />
          </div>
          <div>
            <SummaryRow
              label='Total'
              value={money(summary.inclusive)}
              isTotal
            />
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground'>
        <span>
          Created by{' '}
          <strong className='font-medium text-foreground'>
            {titleCase(order.salesRepName.toLowerCase())}
          </strong>
          {order.createdAt ? (
            <>
              {' '}
              on{' '}
              <strong className='font-medium text-foreground'>
                {format(order.createdAt, 'dd MMM yyyy, h:mm a')}
              </strong>
            </>
          ) : null}
        </span>
        {order.updatedAt ? (
          <span>
            Last updated{' '}
            <strong className='font-medium text-foreground'>
              {format(order.updatedAt, 'dd MMM yyyy, h:mm a')}
            </strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}
