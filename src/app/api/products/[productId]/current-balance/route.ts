import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import {
  getProductBalance,
  getStore,
} from '@/features/store/services/stores/data';
import { getProduct } from '@/features/procurement/services/products/data';

const querySchema = z.object({
  storeId: z.string().uuid('Invalid store ID format'),
  asOfDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const { searchParams } = new URL(req.url);

    const validationResult = querySchema.safeParse({
      storeId: searchParams.get('storeId'),
      asOfDate: searchParams.get('asOfDate'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { storeId, asOfDate } = validationResult.data;

    if (!storeId || !asOfDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const [product, store] = await Promise.all([
      getProduct(productId),
      getStore(storeId),
    ]);

    if (!product)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (!store)
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const currentBalance = await getProductBalance(
      productId,
      storeId,
      new Date(asOfDate)
    );

    return NextResponse.json({ currentBalance });
  } catch (error) {
    console.error('Error fetching current balance:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
