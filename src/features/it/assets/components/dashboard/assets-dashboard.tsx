import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';

import { AssignmentTrendChart } from '@/features/it/assets/components/dashboard/assignment-trend-chart';
import { CostDistributionCharts } from '@/features/it/assets/components/dashboard/cost-distribution-charts';
import { ITAssetKpiCards } from '@/features/it/assets/components/dashboard/kpi-cards';
import { RecentAssignments } from '@/features/it/assets/components/dashboard/recent-assignments';
import { WarrantyExpiryList } from '@/features/it/assets/components/dashboard/warranty-expiry-list';

export function ITAssetsDashboard({ data }: { data: ITAssetsDashboardStats }) {
  return (
    <div className="space-y-6">
      <ITAssetKpiCards kpis={data.kpis} />

      <AssignmentTrendChart data={data.trends.assignmentActivity} />
      <CostDistributionCharts breakdowns={data.breakdowns} />

      <div className="grid gap-4 lg:grid-cols-2">
        <WarrantyExpiryList rows={data.attentionItems.warrantyExpiringSoon} />
        <RecentAssignments rows={data.attentionItems.recentAssignments} />
      </div>
    </div>
  );
}
