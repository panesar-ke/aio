import type { Metadata } from 'next';

import PageHeader from '@/components/custom/page-header';
import {
  SalesDashboardWip,
  WipBadge,
} from '@/features/sales/components/dashboard/dashboard-wip';

export const metadata: Metadata = {
  title: 'Sales Dashboard',
};

export default function SalesDashboardPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Sales Dashboard'
        description='Pipeline health and order performance across the sales module.'
        content={<WipBadge />}
      />
      <SalesDashboardWip />
    </div>
  );
}
