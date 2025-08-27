import { NextResponse } from 'next/server';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await getSelectableProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
