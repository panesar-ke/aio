'use client';
import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { FileScanIcon, MailIcon, PrinterIcon } from 'lucide-react';
import type { Order } from '@/features/procurement/utils/procurement.types';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/components/custom/loaders';

import { dateFormat, numberFormat, titleCase } from '@/lib/helpers/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generateOrderFile,
  sendOrderEmail,
} from '@/features/procurement/services/purchase-orders/actions';
import { formatOrderForFileGeneration } from '@/features/procurement/utils/formatters';
import { ToastContent } from '@/components/custom/toast';

export function OrderView({ order }: { order: Order }) {
  const [isLoading, startTransition] = useTransition();
  const [selectedAction, setSelectedAction] = useState<'GENERATE' | 'EMAIL'>();

  function handleGenerate() {
    setSelectedAction('GENERATE');
    startTransition(async () => {
      const res = await generateOrderFile(
        formatOrderForFileGeneration(order),
        order.reference
      );

      if (res.error) {
        toast(() => (
          <ToastContent
            title="Email Sent"
            message="The purchase order has been emailed to the supplier."
            state="success"
          />
        ));
        return;
      }
    });
  }

  function handleEmailSending() {
    setSelectedAction('EMAIL');
    startTransition(async () => {
      await sendOrderEmail(order.reference);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {!order.fileUrl ? (
          <Button size="lg" onClick={handleGenerate} disabled={isLoading}>
            {!isLoading ? (
              <>
                <FileScanIcon />
                <span>Generate Print</span>
              </>
            ) : (
              isLoading &&
              selectedAction === 'GENERATE' && (
                <ButtonLoader loadingText="Generating..." />
              )
            )}
          </Button>
        ) : (
          <Button size="lg" asChild disabled={isLoading}>
            <a href={order.fileUrl} target="_blank">
              <PrinterIcon />
              <span>Print</span>
            </a>
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={handleEmailSending}
          disabled={isLoading}
        >
          {isLoading && selectedAction === 'EMAIL' ? (
            <ButtonLoader loadingText="Sending..." />
          ) : (
            <>
              <MailIcon />
              <span>Email To Supplier</span>
            </>
          )}
        </Button>
      </div>
      <OrderPrint order={order} />
    </div>
  );
}

function OrderPrint({ order }: { order: Order }) {
  const totals = useMemo(() => {
    return order.ordersDetails.reduce(
      (acc, detail) => {
        const qty = parseFloat(detail.qty);
        const rate = parseFloat(detail.rate);

        return {
          subTotal: acc.subTotal + qty * rate,
          discountTotal:
            acc.discountTotal + parseFloat(detail.discountedAmount),
          amountExclTotal:
            acc.amountExclTotal + parseFloat(detail.amountExclusive),
          vatTotal: acc.vatTotal + parseFloat(detail.vat),
          amountInclTotal:
            acc.amountInclTotal + parseFloat(detail.amountInclusive),
        };
      },
      {
        subTotal: 0,
        discountTotal: 0,
        amountExclTotal: 0,
        vatTotal: 0,
        amountInclTotal: 0,
      }
    );
  }, [order.ordersDetails]);

  const {
    subTotal,
    discountTotal,
    amountExclTotal,
    vatTotal,
    amountInclTotal,
  } = totals;

  return (
    <div className="p-4" id="print-document">
      <header className="flex items-center justify-between pl-2">
        <div className="space-y-2">
          <h1 className="font-bold text-lg uppercase border-b text-muted-foreground">
            purchase order
          </h1>
          <div className="text-lg">
            <strong>LPO No:</strong> <span className="ml-4">{order.id}</span>
          </div>
          <div className="text-lg">
            <strong>Date:</strong>{' '}
            <span className="ml-4">
              {dateFormat(new Date(order.documentDate), 'long')}
            </span>
          </div>
        </div>
        <Image
          className="w-36 h-auto"
          src="/logos/logo-black.png"
          alt="Panesar logo"
          height={360}
          width={600}
        />
      </header>
      <div className="grid grid-cols-12 gap-16 mt-8 pl-2">
        <div className="col-span-6 font-semibold rounded ">
          <div className="bg-primary uppercase text-primary-foreground p-2">
            from
          </div>
          <div className="text-lg uppercase font-light py-2 space-y-1">
            <p>panesar&apos;s kenya ltd</p>
            <p>panesar center, mombasa road</p>
            <p>p.o box 45494-00100,nairobi-kenya</p>
            <p>cell: 0708 555 999/ 0738 555 562</p>
            <p>
              email: <span className="lowercase">info@panesar.co.ke</span>
            </p>
            <p>pin: p051150335i</p>
          </div>
        </div>
        <div className="col-span-6 font-semibold rounded ">
          <div className="bg-primary uppercase text-primary-foreground p-2">
            supplier info
          </div>
          <div className="text-lg uppercase font-light py-2 space-y-1">
            <p>
              <strong className="capitalize mr-2">Company Name:</strong>
              {order.vendor.vendorName}
            </p>
            <p>
              <strong className="capitalize mr-2">Address:</strong>
              {order.vendor.address || 'n/a'}
            </p>
            <p>
              <strong className="mr-2">PIN:</strong>
              {order.vendor.kraPin || 'n/a'}
            </p>
            <p>
              <strong className="capitalize mr-2">cell:</strong>
              {order.vendor.contact || 'n/a'}
            </p>
            <p>
              <strong className="capitalize mr-2">Email:</strong>
              {order.vendor.email || 'n/a'}
            </p>
            <p>
              <strong className="capitalize mr-2">contact person:</strong>
              {order.vendor.contactPerson || 'n/a'}
            </p>
          </div>
        </div>
        <OrderRowPrint details={order.ordersDetails} />
        <OrderSummary
          subTotal={subTotal || 0}
          discounted={discountTotal || 0}
          amountExcl={amountExclTotal || 0}
          vat={vatTotal || 0}
          amountIncl={amountInclTotal || 0}
          userName={order.user.name || 'n/a'}
        />
      </div>
    </div>
  );
}

function OrderRowPrint({ details }: { details: Order['ordersDetails'] }) {
  return (
    <div className="col-span-full">
      <Table className="mt-5 border border-black">
        <TableHeader className="bg-secondary text-lg">
          <TableRow>
            <TableHead className="p-2">Item</TableHead>
            <TableHead className="p-2 w-24">Unit</TableHead>
            <TableHead className="p-2 w-24">Qty</TableHead>
            <TableHead className="p-2 w-32">Unit Price</TableHead>
            <TableHead className="p-2 w-32">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-black">
          {details.map(detail => (
            <TableRow className="text-lg [&>*]:p-2 " key={detail.id}>
              <TableCell className="uppercase">
                {detail.itemId
                  ? detail?.product?.productName
                  : detail?.service?.serviceName}
              </TableCell>
              <TableCell className="uppercase">
                {detail.itemId ? detail?.product?.uom?.abbreviation : 'DEF'}
              </TableCell>
              <TableCell className="w-24 text-center">
                {numberFormat(detail.qty)}
              </TableCell>
              <TableCell className="w-24 text-center">
                {numberFormat(detail.rate)}
              </TableCell>
              <TableCell className="w-24 text-center">
                {numberFormat(parseFloat(detail.rate) * parseFloat(detail.qty))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface OrderSummaryProps {
  subTotal: number;
  discounted: number;
  amountExcl: number;
  vat: number;
  amountIncl: number;
  userName: string;
}

function OrderSummary({
  discounted,
  subTotal,
  amountExcl,
  amountIncl,
  vat,
  userName,
}: OrderSummaryProps) {
  return (
    <div className="space-y-6 col-span-full ">
      <div className="flex justify-between">
        <Card className="self-start border-2 border-black">
          <CardHeader className="p-2">
            <CardTitle className="text-lg font-bold uppercase underline">
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm p-2 pt-0">
            <p>1. Please indicate LPO no on the invoice.</p>
            <p>2. All deliveries should have delivery notes.</p>
            <p>3. Please notify us immediately if you are unable to supply.</p>
            <p>4. Send all correspondences to procurement@panesar.co.ke.</p>
          </CardContent>
        </Card>
        <Card className="w-80 border-2 border-black">
          <CardContent className="p-2 space-y-2 text-lg">
            <div className="flex items-center justify-between">
              <div className="uppercase font-bold text-lg">sub-total</div>
              <div>Ksh:&nbsp;{numberFormat(subTotal)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="uppercase text-lg font-bold">Discount</div>
              <div>
                {discounted > 0 ? `Ksh: ;${numberFormat(discounted)}` : '-'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="uppercase font-bold text-lg">
                Discounted Price
              </div>
              <div>Ksh:&nbsp;{numberFormat(subTotal - discounted)}</div>
            </div>

            <div className="flex items-center justify-between border-t-2 border-t-black">
              <div className="uppercase font-bold text-lg">Amount Excl</div>
              <div>Ksh:&nbsp;{numberFormat(amountExcl)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="uppercase text-lg font-bold">Vat</div>
              <div>{vat > 0 ? `Ksh: ${numberFormat(vat)}` : '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="uppercase font-bold text-lg">Amount Incl</div>
              <div>Ksh:&nbsp;{numberFormat(amountIncl)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-base flex items-center gap-6 pl-2">
        <p className="capitalize">
          <strong>Prepared:</strong> {titleCase(userName)}
        </p>
        <p>
          <strong>Date:</strong> {dateFormat(new Date(), 'long')}
        </p>
      </div>
    </div>
  );
}
