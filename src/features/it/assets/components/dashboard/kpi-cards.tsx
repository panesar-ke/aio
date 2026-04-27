import {
  ActivityIcon,
  BarChart3Icon,
  BoxesIcon,
  CoinsIcon,
  HardDriveIcon,
  WrenchIcon,
} from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';
import { numberFormat } from '@/lib/helpers/formatters';

type KpiProps = ITAssetsDashboardStats['kpis'];

export function ITAssetKpiCards({ kpis }: { kpis: KpiProps }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Assets"
          value={numberFormat(kpis.totalAssets, 0)}
          description={`${numberFormat(kpis.assignedAssets, 0)} assigned`}
          icon={<BoxesIcon className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Utilization"
          value={`${numberFormat(kpis.utilizationRate)}%`}
          description={`${numberFormat(kpis.unassignedAssets, 0)} currently unassigned`}
          icon={<ActivityIcon className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          title="In Repair"
          value={numberFormat(kpis.inRepairAssets, 0)}
          description={`${numberFormat(kpis.retiredOrDisposedAssets, 0)} retired/disposed`}
          icon={<WrenchIcon className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Portfolio Cost"
          value={`Ksh ${numberFormat(kpis.portfolioCost)}`}
          description={`${numberFormat(kpis.uncostedAssets, 0)} assets uncosted`}
          icon={<CoinsIcon className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Average Asset Cost"
          value={`Ksh ${numberFormat(kpis.averageAssetCost)}`}
          description="Across assets with recorded purchase cost"
          icon={<BarChart3Icon className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Assignable Pool"
          value={numberFormat(
            kpis.totalAssets - kpis.retiredOrDisposedAssets,
            0,
          )}
          description="Active inventory excluding retired/disposed"
          icon={<HardDriveIcon className="size-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Asset Utilization Gauge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={kpis.utilizationRate} />
          <p className="text-xs text-muted-foreground">
            {numberFormat(kpis.assignedAssets, 0)} out of{' '}
            {numberFormat(kpis.totalAssets, 0)} assets are currently assigned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
