import { CogIcon } from 'lucide-react';
import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';

export const metadata: Metadata = {
  title: 'Auto Orders',
};

export default async function AutoOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto Orders"
        buttonText="Configure Options"
        description="Manage your auto orders efficiently."
        Icon={CogIcon}
        path="/procurement/auto-orders/configure"
      />
    </div>
  );
}
