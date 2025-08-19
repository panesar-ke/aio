'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  OrderByCriteriaProduct,
  OrderByCriteriaProject,
} from '@/features/procurement/utils/procurement.types';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';
import { ReportDataTable } from '@/components/custom/report-datatable';
import { TableCell } from '@/components/ui/table';

const projectsColumns: Array<ColumnDef<OrderByCriteriaProject>> = [
  {
    accessorKey: 'id',
    header: () => <div>Order #</div>,
  },
  {
    accessorKey: 'documentDate',
    header: () => 'Date',
    cell: ({
      row: {
        original: { documentDate },
      },
    }) => dateFormat(documentDate, 'reporting'),
  },
  {
    accessorKey: 'itemName',
    header: () => 'Item',
  },
  {
    accessorKey: 'qty',
    header: () => 'Quantity',
  },
  {
    accessorKey: 'discount',
    header: () => <div className="text-right">Discount</div>,
    cell: ({
      row: {
        original: { discount },
      },
    }) => <div className="text-right">{numberFormat(discount)}</div>,
  },
  {
    accessorKey: 'subTotal',
    header: () => <div className="text-right">Sub Total</div>,
    cell: ({
      row: {
        original: { subTotal },
      },
    }) => <div className="text-right">{numberFormat(subTotal)}</div>,
  },
  {
    accessorKey: 'vat',
    header: () => <div className="text-right">VAT</div>,
    cell: ({
      row: {
        original: { vat },
      },
    }) => <div className="text-right">{numberFormat(vat)}</div>,
  },
  {
    accessorKey: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: ({
      row: {
        original: { totalAmount },
      },
    }) => <div className="text-right">{numberFormat(totalAmount)}</div>,
  },
];

const productColumns: Array<ColumnDef<OrderByCriteriaProduct>> = [
  {
    accessorKey: 'id',
    header: () => <div>Order #</div>,
  },
  {
    accessorKey: 'documentDate',
    header: () => 'Date',
    cell: ({
      row: {
        original: { documentDate },
      },
    }) => dateFormat(documentDate, 'reporting'),
  },
  {
    accessorKey: 'project',
    header: () => 'Project',
  },
  {
    accessorKey: 'qty',
    header: () => 'Quantity',
  },
  {
    accessorKey: 'rate',
    header: () => <div className="text-right">Rate</div>,
    cell: ({
      row: {
        original: { rate },
      },
    }) => <div className="text-right">{numberFormat(rate)}</div>,
  },
  {
    accessorKey: 'discount',
    header: () => <div className="text-right">Discount</div>,
    cell: ({
      row: {
        original: { discount },
      },
    }) => <div className="text-right">{numberFormat(discount)}</div>,
  },
  {
    accessorKey: 'subTotal',
    header: () => <div className="text-right">Sub Total</div>,
    cell: ({
      row: {
        original: { subTotal },
      },
    }) => <div className="text-right">{numberFormat(subTotal)}</div>,
  },
  {
    accessorKey: 'vat',
    header: () => <div className="text-right">VAT</div>,
    cell: ({
      row: {
        original: { vat },
      },
    }) => <div className="text-right">{numberFormat(vat)}</div>,
  },
  {
    accessorKey: 'totalAmount',
    header: () => <div className="text-right">Total</div>,
    cell: ({
      row: {
        original: { totalAmount },
      },
    }) => <div className="text-right">{numberFormat(totalAmount)}</div>,
  },
];

export function OrderByCriteriaProjectTable({
  data,
}: {
  data: Array<OrderByCriteriaProject>;
}) {
  const { discounted, subTotal, vat, total } = data.reduce(
    (acc, cur) => {
      acc.discounted += parseFloat(cur.discount.toString());
      acc.subTotal += parseFloat(cur.subTotal.toString());
      acc.vat += parseFloat(cur.vat.toString());
      acc.total += parseFloat(cur.totalAmount.toString());
      return acc;
    },
    {
      discounted: 0,
      subTotal: 0,
      vat: 0,
      total: 0,
    }
  );

  return (
    <ReportDataTable
      reportTitle="Order By Criteria"
      excelData={data.map(item => ({
        'Order #': item.id,
        Date: dateFormat(item.documentDate, 'reporting'),
        Item: item.itemName,
        Quantity: item.qty,
        Discount: numberFormat(item.discount),
        'Sub Total': numberFormat(item.subTotal),
        VAT: numberFormat(item.vat),
        Total: numberFormat(item.totalAmount),
      }))}
      columns={projectsColumns}
      customFooter={
        <>
          <TableCell className="text-center" colSpan={4}>
            Total
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(discounted)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(subTotal)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(vat)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(total)}
          </TableCell>
        </>
      }
      data={data}
      defaultPageSize={30}
    />
  );
}

export function OrderByCriteriaProductTable({
  data,
}: {
  data: Array<OrderByCriteriaProduct>;
}) {
  const { discount, subTotal, vat, totalAmount } = data.reduce(
    (acc, cur) => {
      acc.discount += parseFloat(cur.discount.toString());
      acc.subTotal += parseFloat(cur.subTotal.toString());
      acc.vat += parseFloat(cur.vat.toString());
      acc.totalAmount += parseFloat(cur.totalAmount.toString());
      return acc;
    },
    {
      discount: 0,
      subTotal: 0,
      vat: 0,
      totalAmount: 0,
    }
  );

  return (
    <ReportDataTable
      reportTitle="Order By Criteria"
      excelData={data.map(item => ({
        'Order #': item.id,
        Date: dateFormat(item.documentDate, 'reporting'),
        Project: item.project,
        Quantity: item.qty,
        Rate: numberFormat(item.rate),
        Discount: numberFormat(item.discount),
        'Sub Total': numberFormat(item.subTotal),
        VAT: numberFormat(item.vat),
        Total: numberFormat(item.totalAmount),
      }))}
      columns={productColumns}
      data={data}
      defaultPageSize={30}
      customFooter={
        <>
          <TableCell className="text-center" colSpan={5}>
            Total
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(discount)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(subTotal)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(vat)}
          </TableCell>
          <TableCell className="text-right font-semibold">
            {numberFormat(totalAmount)}
          </TableCell>
        </>
      }
    />
  );
}
