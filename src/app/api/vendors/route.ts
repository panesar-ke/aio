import { NextResponse } from 'next/server';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';

export async function GET() {
  try {
    const vendors = await getActiveVendors();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
