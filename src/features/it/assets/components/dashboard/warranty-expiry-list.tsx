import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ITAssetsDashboardStats } from '@/features/it/assets/services/dashboard';
import { dateFormat } from '@/lib/helpers/formatters';

export function WarrantyExpiryList({
  rows,
}: {
  rows: ITAssetsDashboardStats['attentionItems']['warrantyExpiringSoon'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Warranty Expiring Soon (60 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No warranties are expiring in the next 60 days.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.category.toUpperCase()}</TableCell>
                  <TableCell>{row.department.toUpperCase()}</TableCell>
                  <TableCell>{dateFormat(row.warrantyExpiryDate, 'long')}</TableCell>
                  <TableCell>{row.daysRemaining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
