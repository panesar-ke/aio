import type { ReactNode } from 'react';

import { format, intervalToDuration } from 'date-fns';
import {
  ArrowUpRightIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
} from 'lucide-react';
import Link from 'next/link';

import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AccountOrdersTable } from '@/features/sales/components/accounts/account-orders-table';
import { type getAccountDetails } from '@/features/sales/services/accounts/data';
import {
  formatCurrency,
  getDateValue,
} from '@/features/sales/utils/account-helpers';
import {
  compactNumberFormatter,
  getInitials,
  titleCase,
} from '@/lib/helpers/formatters';
import { toNumber } from '@/lib/helpers/numbers';
import { cn } from '@/lib/utils';

type AccountDetails = NonNullable<
  Awaited<ReturnType<typeof getAccountDetails>>
>;
type AccountOrder = AccountDetails['orders'][number];

/**
 * Aggregates an account's orders into the figures shown on its detail page.
 *
 * Two rules matter here. Orders can be raised in KES or USD, so totals sum
 * `amountInLocalCurrency` - adding raw `amountInclusive` across currencies
 * would add two different units together. And cancelled orders are not
 * revenue: they stay in the history table but count towards nothing.
 */
export function getAccountOrderMetrics(orders: Array<AccountOrder>) {
  const billableOrders = orders.filter((order) => order.status !== 'cancelled');

  const totalSpend = billableOrders.reduce(
    (sum, order) => sum + toNumber(order.amountInLocalCurrency),
    0,
  );
  const totalItems = billableOrders.reduce(
    (sum, order) => sum + toNumber(order.itemCount),
    0,
  );
  const totalOrders = billableOrders.length;

  return {
    totalSpend,
    totalOrders,
    totalItems,
    averageOrderValue: totalOrders > 0 ? totalSpend / totalOrders : 0,
    // Orders arrive newest first, so the first billable one is the last
    // actual purchase.
    lastPurchaseDate: billableOrders[0]?.dateRaised ?? null,
  };
}

export function getRelativeTimeLabel(date: string, now = new Date()) {
  const duration = intervalToDuration({
    start: getDateValue(date),
    end: now,
  });

  const parts = [
    duration.years
      ? `${duration.years} year${duration.years === 1 ? '' : 's'}`
      : null,
    duration.months
      ? `${duration.months} month${duration.months === 1 ? '' : 's'}`
      : null,
    duration.days
      ? `${duration.days} day${duration.days === 1 ? '' : 's'}`
      : null,
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return 'Today';
  }

  return `${(parts.slice(0, 2) as Array<string>).join(', ')} ago`;
}

function formatDisplayDate(date: string) {
  return format(getDateValue(date), 'dd MMM yyyy');
}

function getContactPerson(name: string, company: string) {
  const normalizedName = name.trim().toLowerCase();
  const normalizedCompany = company.trim().toLowerCase();

  if (!normalizedName || normalizedName === normalizedCompany) {
    return '—';
  }

  return titleCase(normalizedName);
}

function getSpendTierLabel(totalSpend: number) {
  if (totalSpend >= 1000000) return 'High spend';
  if (totalSpend >= 100000) return 'Medium spend';
  return 'Low spend';
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b py-3 last:border-b-0',
        className,
      )}
    >
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='max-w-56 text-right text-sm font-medium text-foreground'>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  subtextClassName,
}: {
  label: string;
  value: React.ReactNode;
  subtext: React.ReactNode;
  subtextClassName?: string;
}) {
  return (
    <Card className='gap-3 rounded-[1.125rem] py-4 shadow-none'>
      <CardContent className='space-y-1.5 px-5'>
        <p className='text-[11px] font-semibold tracking-[0.045em] text-muted-foreground uppercase'>
          {label}
        </p>
        <p className='text-2xl font-semibold tracking-[-0.01em] text-foreground'>
          {value}
        </p>
        <p className={cn('text-xs text-muted-foreground', subtextClassName)}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}

export function AccountDetailsPageContent({
  details,
}: {
  details: AccountDetails;
}) {
  const { account, orders } = details;
  const metrics = getAccountOrderMetrics(orders);

  return (
    <div className='space-y-6'>
      <section className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3.5'>
          <Avatar className='size-11 bg-secondary text-secondary-foreground'>
            <AvatarFallback className='bg-secondary text-base font-bold text-secondary-foreground'>
              {getInitials(titleCase(account.company))}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-xl font-semibold tracking-[-0.01em] text-foreground'>
              {titleCase(account.company)}
            </h1>
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              <p className='text-sm text-muted-foreground'>
                Customer since {formatDisplayDate(account.createdAt)}
              </p>
              <Badge
                variant='info'
                className='rounded-full px-2.5 py-1 text-[11px]'
              >
                <CheckIcon className='size-3' />
                Converted from lead
              </Badge>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button type='button' size='lg' className='gap-2' asChild>
            <Link
              href={`/sales/orders/new?account=${account.id}`}
              prefetch={false}
            >
              <PlusIcon className='size-4' />
              New Sales Order
            </Link>
          </Button>
          <DropdownMenu>
            <CustomDropdownTrigger />
            <CustomDropdownContent>
              <DropdownMenuItem asChild>
                <Link
                  prefetch={false}
                  href={`/sales/accounts/${account.id}/edit`}
                >
                  <PencilIcon className='size-3 text-muted-foreground' />
                  <span className='text-xs'>Edit Account</span>
                </Link>
              </DropdownMenuItem>
            </CustomDropdownContent>
          </DropdownMenu>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label='Total Spend'
          value={`KES ${compactNumberFormatter(metrics.totalSpend)}`}
          subtext={`Across ${metrics.totalOrders} sales orders`}
        />
        <StatCard
          label='Total Orders'
          value={metrics.totalOrders}
          subtext='Excludes cancelled orders'
        />
        <StatCard
          label='Average Order Value'
          value={`KES ${compactNumberFormatter(metrics.averageOrderValue)}`}
          subtext='Excludes cancelled orders'
        />
        <StatCard
          label='Last Purchase'
          value={
            metrics.lastPurchaseDate
              ? formatDisplayDate(metrics.lastPurchaseDate)
              : '—'
          }
          subtext={
            metrics.lastPurchaseDate
              ? getRelativeTimeLabel(metrics.lastPurchaseDate)
              : 'No purchases yet'
          }
          subtextClassName={
            metrics.lastPurchaseDate ? 'text-destructive' : undefined
          }
        />
      </section>

      <section className='grid gap-5 lg:grid-cols-2'>
        <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
          <CardHeader className='border-b px-5 py-4'>
            <CardTitle className='text-sm'>Contact Details</CardTitle>
            <CardDescription>
              Primary information for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className='px-5 py-2'>
            <InfoRow label='Company' value={titleCase(account.company)} />
            <InfoRow
              label='Contact Person'
              value={getContactPerson(account.name, account.company)}
            />
            <InfoRow label='Phone' value={account.phone ?? '—'} />
            <InfoRow
              label='Email'
              value={
                account.email ? (
                  <a
                    href={`mailto:${account.email}`}
                    className='text-info-foreground hover:underline'
                  >
                    {account.email}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              label='KRA PIN'
              value={
                <span className='font-mono tracking-[0.02em]'>
                  {account.kraPin ?? '—'}
                </span>
              }
            />
          </CardContent>
        </Card>

        <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
          <CardHeader className='border-b px-5 py-4'>
            <CardTitle className='text-sm'>Account Summary</CardTitle>
            <CardDescription>
              Key commercial details for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className='px-5 py-2'>
            <InfoRow label='Sales Person' value={account.salesPerson ?? '—'} />
            <InfoRow
              label='Account State'
              value={
                <Badge variant='secondary'>{titleCase(account.state)}</Badge>
              }
            />
            <InfoRow
              label='Spend Tier'
              value={
                <Badge variant='outline'>
                  {getSpendTierLabel(metrics.totalSpend)}
                </Badge>
              }
            />
            <InfoRow label='Total Orders' value={metrics.totalOrders} />
            <InfoRow label='Items Ordered' value={metrics.totalItems} />
            <InfoRow
              label='Average Order Value'
              value={formatCurrency(metrics.averageOrderValue)}
            />
          </CardContent>
        </Card>
      </section>

      <Card className='gap-0 rounded-[1.125rem] py-0 shadow-none'>
        <CardHeader className='border-b px-5 py-4 sm:flex sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='text-sm'>Sales Order History</CardTitle>
            <CardDescription>
              All orders placed by this account.
            </CardDescription>
          </div>
          <Link href={`/sales/orders?account=${account.id}`} prefetch={false}>
            <Button
              type='button'
              variant='ghost'
              className='gap-2 px-0 text-muted-foreground'
            >
              View All in Sales Orders
              <ArrowUpRightIcon className='size-4' />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className='px-0 py-5'>
          <AccountOrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
