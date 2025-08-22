import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import { userRights } from '@/drizzle/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const rights = await db
      .select({
        formId: userRights.formId,
      })
      .from(userRights)
      .where(eq(userRights.userId, userId));

    return NextResponse.json(rights);
  } catch (error) {
    console.error('Error fetching user rights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rights' },
      { status: 500 }
    );
  }
}
