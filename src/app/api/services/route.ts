import { NextResponse } from 'next/server';
import { getSelectableServices } from '@/features/procurement/services/material-requisitions/data';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const services = await getSelectableServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
