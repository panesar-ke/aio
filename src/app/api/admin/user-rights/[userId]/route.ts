import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import { userRights } from '@/drizzle/schema';

type ResponseData = {
  error: string | null;
  data?: Array<{ formId: number }>;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json<ResponseData>(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const rights = await db
      .select({ formId: userRights.formId })
      .from(userRights)
      .where(eq(userRights.userId, userId));

    return NextResponse.json<ResponseData>(
      { data: rights, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user rights:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to fetch user rights' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json<ResponseData>(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
