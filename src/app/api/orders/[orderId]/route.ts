import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import db from '@/drizzle/db';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (isNaN(Number(orderId))) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const orderDetails = await db.query.ordersHeader.findFirst({
      columns: { billNo: true, vendorId: true },
      with: {
        ordersDetails: {
          columns: { itemId: true, qty: true, rate: true, id: true },
          where: (details, { isNotNull, and, eq }) =>
            and(isNotNull(details.itemId), eq(details.received, false)),
          with: {
            product: {
              columns: { productName: true },
            },
          },
        },
        vendor: { columns: { vendorName: true } },
      },
      where: (order, { eq, and }) =>
        and(eq(order.id, Number(orderId)), eq(order.isDeleted, false)),
    });

    if (!orderDetails)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const formattedDetails = {
      ...orderDetails,
      vendorName: orderDetails.vendor?.vendorName as string,
      ordersDetails: orderDetails.ordersDetails.map(detail => ({
        ...detail,
        product: detail.product?.productName as string,
      })),
    };

    return NextResponse.json({ data: formattedDetails }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
