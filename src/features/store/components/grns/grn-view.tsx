import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { dateFormat } from '@/lib/helpers/formatters';
import type { getGrn } from '@/features/store/services/grns/data';

type GrnData = Awaited<ReturnType<typeof getGrn>>;

interface GrnViewProps {
  grn: GrnData;
}

export function GrnView({ grn }: GrnViewProps) {
  if (!grn) return notFound();
  const totalValue =
    grn.grnsDetails?.reduce((sum, detail) => {
      return sum + Number(detail.qty) * Number(detail.rate);
    }, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>GRN #{grn.id}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Receipt Date
              </label>
              <p className="text-sm">{dateFormat(grn.receiptDate, 'long')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Invoice Number
              </label>
              <p className="text-sm">{grn.invoiceNo || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Vendor
              </label>
              <p className="text-sm font-medium">
                {grn.vendor?.vendorName?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Receiving Store
              </label>
              <p className="text-sm font-medium">
                {grn.store?.storeName?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Order ID
              </label>
              <p className="text-sm">#{grn.orderId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Total Value
              </label>
              <p className="text-sm font-medium">
                KES {totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items Received</CardTitle>
        </CardHeader>
        <CardContent>
          {grn.grnsDetails && grn.grnsDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-80 min-w-80">Item</TableHead>
                    <TableHead className="w-24 min-w-24">Ordered Qty</TableHead>
                    <TableHead className="w-24 min-w-24">
                      Received Qty
                    </TableHead>
                    <TableHead className="w-24 min-w-24">Rate</TableHead>
                    <TableHead className="w-40 min-w-40">Remarks</TableHead>
                    <TableHead className="w-32 min-w-32">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grn.grnsDetails.map(detail => {
                    const lineTotal = Number(detail.qty) * Number(detail.rate);
                    return (
                      <TableRow key={detail.id}>
                        <TableCell className="w-80 font-medium">
                          {detail.product?.productName || 'Unknown Product'}
                        </TableCell>
                        <TableCell className="w-24">
                          {detail.orderedQty
                            ? Number(detail.orderedQty).toLocaleString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="w-24">
                          {Number(detail.qty).toLocaleString()}
                        </TableCell>
                        <TableCell className="w-24">
                          KES {Number(detail.rate).toLocaleString()}
                        </TableCell>
                        <TableCell className="w-40">
                          {detail.remarks || '-'}
                        </TableCell>
                        <TableCell className="w-32 font-medium">
                          KES {lineTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No items found for this GRN
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
