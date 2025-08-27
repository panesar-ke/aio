'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type {
  OrderRegister,
  OrderRegisterWithValues,
} from '@/features/procurement/utils/procurement.types';
import { dateFormat, numberFormat } from '@/lib/helpers/formatters';
import { ReportDataTable } from '@/components/custom/report-datatable';
import { TableCell } from '@/components/ui/table';

const orderRegisterColumns = (): Array<ColumnDef<OrderRegister>> => {
  return [
    {
      accessorKey: 'id',
      header: () => <div>Ref</div>,
    },
    {
      accessorKey: 'billDate',
      header: () => <div>Order Date</div>,
      cell: ({
        row: {
          original: { billDate, documentDate },
        },
      }) => <div>{dateFormat(billDate || documentDate, 'reporting')}</div>,
    },
    {
      accessorKey: 'billNo',
      header: () => <div>Bill No</div>,
      cell: ({
        row: {
          original: { billNo },
        },
      }) => <div>{billNo?.toUpperCase()}</div>,
    },
    {
      accessorKey: 'vendorName',
      header: () => <div>Vendor</div>,
    },
    {
      accessorKey: 'totalDiscount',
      header: () => <div className="text-right">Discounted</div>,
      cell: ({
        row: {
          original: { totalDiscount },
        },
      }) => (
        <div className="text-right font-medium">
          {numberFormat(totalDiscount)}
        </div>
      ),
    },
    {
      accessorKey: 'subTotal',
      header: () => <div className="text-right">Sub Total</div>,
      cell: ({
        row: {
          original: { subTotal },
        },
      }) => (
        <div className="text-right font-medium">{numberFormat(subTotal)}</div>
      ),
    },
    {
      accessorKey: 'vat',
      header: () => <div className="text-right">VAT</div>,
      cell: ({
        row: {
          original: { vat },
        },
      }) => <div className="text-right font-medium">{numberFormat(vat)}</div>,
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">Total</div>,
      cell: ({
        row: {
          original: { totalAmount },
        },
      }) => (
        <div className="text-right font-medium">
          {numberFormat(totalAmount)}
        </div>
      ),
    },
  ];
};

const orderRegisterByItems = (): Array<ColumnDef<OrderRegisterWithValues>> => {
  return [
    {
      accessorKey: 'id',
      header: () => <div>LPO #</div>,
    },
    {
      accessorKey: 'documentDate',
      header: () => <div>Document Date</div>,
      cell: ({
        row: {
          original: { billDate, documentDate },
        },
      }) => <div>{dateFormat(billDate || documentDate, 'reporting')}</div>,
    },
    {
      accessorKey: 'vendorName',
      header: () => <div>Vendor</div>,
    },
    {
      accessorKey: 'billNo',
      header: () => <div>Invoice No</div>,
    },
    {
      accessorKey: 'itemName',
      header: () => <div>Item</div>,
    },
    {
      accessorKey: 'quantity',
      header: () => <div>Quantity</div>,
      cell: ({
        row: {
          original: { quantity },
        },
      }) => <div>{quantity}</div>,
    },
    {
      accessorKey: 'unitPrice',
      header: () => <div>Unit Price</div>,
      cell: ({
        row: {
          original: { unitPrice },
        },
      }) => <div>{numberFormat(unitPrice)}</div>,
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
      accessorKey: 'totalPrice',
      header: () => <div className="text-right">Total Price</div>,
      cell: ({
        row: {
          original: { totalPrice },
        },
      }) => <div className="text-right">{numberFormat(totalPrice)}</div>,
    },
  ];
};

export function OrderDatatable({ data }: { data: Array<OrderRegister> }) {
  const { discount, subTotal, vat, totalAmount } = data.reduce(
    (acc, cur) => {
      acc.discount += parseFloat(cur.totalDiscount.toString());
      acc.subTotal += parseFloat(cur.subTotal.toString());
      acc.vat += parseFloat(cur.vat.toString());
      acc.totalAmount += parseFloat(cur.totalAmount.toString());
      return acc;
    },
    { discount: 0, subTotal: 0, vat: 0, totalAmount: 0 }
  );
  return (
    <ReportDataTable
      columns={orderRegisterColumns()}
      data={data}
      reportTitle="Order Report"
      // reportDescription="Detailed report of all orders"
      defaultPageSize={25}
      orientation="landscape"
      excelData={data.map(item => ({
        Ref: item.id,
        'Order Date': dateFormat(
          item.billDate || item.documentDate,
          'reporting'
        ),
        'Bill No': item.billNo?.toUpperCase(),
        Vendor: item.vendorName.toUpperCase(),
        Discounted: numberFormat(item.totalDiscount),
        'Sub Total': numberFormat(item.subTotal),
        VAT: numberFormat(item.vat),
        Total: numberFormat(item.totalAmount),
      }))}
      customFooter={
        <>
          <TableCell colSpan={4} className="font-semibold text-center">
            Total:
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

export function OrderRegisterByItemsDatatable({
  data,
}: {
  data: Array<OrderRegisterWithValues>;
}) {
  const { discountTotal, totalPrice } = data.reduce(
    (acc, cur) => {
      acc.discountTotal += parseFloat(cur.discount);
      acc.totalPrice += parseFloat(cur.totalPrice);
      return acc;
    },
    { discountTotal: 0, totalPrice: 0 }
  );
  return (
    <ReportDataTable
      columns={orderRegisterByItems()}
      data={data}
      excelData={data.map(item => ({
        Date: dateFormat(item.billDate || item.documentDate, 'reporting'),
        'LPO #': item.id,
        Vendor: item.vendorName.toUpperCase(),
        'Invoice No': item.billNo ? `|${item.billNo}` : '',
        Item: item.itemName,
        Quantity: item.quantity,
        'Unit Price': item.unitPrice,
        Discount: item.discount,
        'Total Price': item.totalPrice,
      }))}
      reportTitle="Order Report"
      // reportDescription="Detailed report of all orders"
      defaultPageSize={25}
      orientation="landscape"
      customFooter={
        <>
          <TableCell colSpan={5} className="font-semibold text-center">
            Total
          </TableCell>
          <TableCell className="font-semibold text-right">
            {numberFormat(discountTotal)}
          </TableCell>
          <TableCell className="font-semibold text-right">
            {numberFormat(totalPrice)}
          </TableCell>
        </>
      }
    />
  );
}
