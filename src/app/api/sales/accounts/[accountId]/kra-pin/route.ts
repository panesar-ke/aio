import type { NextRequest } from 'next/server';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import db from '@/drizzle/db';
import { saleAccounts } from '@/drizzle/schema';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    await requireAnyPermission(['sales:admin', 'sales:standard'], {
      mode: 'api',
    });

    const { accountId } = await params;
    if (!z.string().uuid().safeParse(accountId).success) {
      return NextResponse.json(
        { message: 'Invalid account ID' },
        { status: 400 },
      );
    }

    const [account] = await db
      .select({ kraPin: saleAccounts.kraPin })
      .from(saleAccounts)
      .where(eq(saleAccounts.id, accountId));

    if (!account) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ kraPin: account.kraPin });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.error(error);
    return NextResponse.json(
      { message: 'Failed to fetch KRA PIN' },
      { status: 500 },
    );
  }
}
