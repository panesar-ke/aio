import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';
import { dateFormat } from '@/lib/helpers/formatters';

export function RecentAssignments({
  rows,
}: {
  rows: ITAssetsDashboardStats['attentionItems']['recentAssignments'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Assignment Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assignment activity has been logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div
                key={row.id}
                className="rounded-lg border px-3 py-2 text-sm flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{row.assetName}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned to {row.userName}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{dateFormat(row.assignedDate, 'long')}</p>
                  <p>
                    {row.returnedDate
                      ? `Returned ${dateFormat(row.returnedDate, 'long')}`
                      : 'Still assigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
