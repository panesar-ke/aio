import { NextResponse } from 'next/server';
import { getSelectableProjects } from '@/features/procurement/services/material-requisitions/data';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const projects = await getSelectableProjects();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
