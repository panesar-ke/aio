import { NextResponse } from 'next/server';
import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
