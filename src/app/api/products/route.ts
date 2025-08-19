import { NextResponse } from 'next/server';
import { getSelectableProducts } from '@/features/procurement/services/material-requisitions/data';

export async function GET() {
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
