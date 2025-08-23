'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { FileScanIcon, PrinterIcon, SparkleIcon } from 'lucide-react';
import type { Requisition } from '@/features/procurement/utils/procurement.types';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/components/custom/loaders';
import { generateRequisitionAction } from '@/features/procurement/services/material-requisitions/action';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { numberFormat } from '@/lib/helpers/formatters';

export function RequisitionView({ requisition }: { requisition: Requisition }) {
  const [state, action, pending] = useActionState(generateRequisitionAction, {
    success: false,
    error: null,
    fileUrl: null,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {!requisition.fileUrl && !state.fileUrl ? (
          <form action={action}>
            <input
              type="hidden"
              name="requisitionId"
              value={requisition.reference}
            />
            <Button size="lg" disabled={pending}>
              {!pending ? (
                <>
                  <FileScanIcon />
                  <span>Generate</span>
                </>
              ) : (
                <ButtonLoader loadingText="Generating..." />
              )}
            </Button>
          </form>
        ) : (
          <Button size="lg" asChild>
            <a
              href={(state.fileUrl || requisition.fileUrl) as string}
              target="_blank"
            >
              <PrinterIcon />
              <span>Print</span>
            </a>
          </Button>
        )}
        {requisition.mrqDetails.filter(d => d.linked).length === 0 && (
          <Button variant="tertiary" size="lg" disabled={pending} asChild>
            <Link
              href={`/procurement/purchase-order/new?requisition=${requisition.reference}`}
            >
              <SparkleIcon />
              Generate LPO
            </Link>
          </Button>
        )}
      </div>
      <RequisitionDetails mrq={requisition} />
    </div>
  );
}

function RequisitionDetails({ mrq }: { mrq: Requisition }) {
  let totalGross = 0;
  return (
    <div id="pdfContent" className="p-4">
      <header className="flex items-center pl-2">
        <Image
          className="w-36 h-auto"
          src="/logos/logo-black.png"
          alt="Panesar logo"
          height={360}
          width={600}
        />
        <h1 className="text-2xl font-bold uppercase flex-1 text-center">
          material requisition note
        </h1>
      </header>
      <div className="mt-8 pl-2">
        <div className="flex items-center justify-between">
          <div className="text-lg flex items-center">
            <span className="font-medium mr-2">Date:</span>
            <span>{format(new Date(mrq.documentDate), 'PPP')}</span>
          </div>
          <div className="text-lg flex items-center">
            <span className="font-medium mr-2">MRQ No:</span>
            <span>{mrq.id}</span>
          </div>
        </div>
        <Table className="mt-5 border border-black">
          <TableHeader className="bg-secondary text-lg">
            <TableRow>
              <TableHead className="p-2 w-8">#</TableHead>
              <TableHead className="p-2 w-1/3">Item</TableHead>
              <TableHead className="p-2 w-16">Units</TableHead>
              <TableHead className="p-2 w-16 text-center">Qty</TableHead>
              <TableHead className="p-2 w-16 text-center">Rate</TableHead>
              <TableHead className="p-2 text-center">Gross</TableHead>
              <TableHead className="p-2 ">Project</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-black">
            {mrq.mrqDetails.map((item, i) => {
              const buyingPrice = item.itemId
                ? numberFormat(item.product?.buyingPrice || 0)
                : numberFormat(item.service?.serviceFee || 0);
              const gross =
                parseFloat(buyingPrice.replace(/[^0-9.-]+/g, '')) *
                Number(item.qty);
              totalGross += gross;
              return (
                <Row
                  key={item.id}
                  item={item}
                  i={i}
                  buyingPrice={buyingPrice}
                  gross={gross}
                />
              );
            })}
            <TableRow className="text-lg">
              <TableCell colSpan={5} className="text-center font-semibold">
                TOTAL
              </TableCell>
              <TableCell className="text-center font-semibold">
                {numberFormat(totalGross)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface RowProps {
  item: Requisition['mrqDetails'][number];
  i: number;
  buyingPrice: string;
  gross: number;
}

function Row({ item, i, buyingPrice, gross }: RowProps) {
  return (
    <TableRow className="text-lg">
      <TableCell className="p-2">{i + 1}</TableCell>
      <TableCell className="p-2 uppercase">
        {item.itemId
          ? item.product?.productName || ''
          : item.service?.serviceName || ''}
      </TableCell>
      <TableCell className="p-2 uppercase">
        {item.itemId ? item.product?.uom?.abbreviation || 'DEF' : 'DEF'}
      </TableCell>
      <TableCell className="p-2 text-center">{item.qty}</TableCell>
      <TableCell className="p-2 text-center">{buyingPrice}</TableCell>
      <TableCell className="p-2 text-center">{numberFormat(gross)}</TableCell>
      <TableCell className="p-2">
        {item.project.projectName.toUpperCase()}
      </TableCell>
    </TableRow>
  );
}
