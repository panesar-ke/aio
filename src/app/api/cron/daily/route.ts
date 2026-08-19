import { lt } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import { sessions } from '@/drizzle/schema';
import { env } from '@/env/server';
import { getCronSecret } from '@/lib/cron-token';

const SESSION_RETENTION_DAYS_PAST_EXPIRY = 30;

export async function GET(request: NextRequest) {
  if (env.CRON_SECRET) {
    const token = getCronSecret(request);
    if (!token || token !== env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  } else {
    return NextResponse.json(
      { message: 'Server misconfigured: CRON_SECRET is not set' },
      { status: 500 },
    );
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SESSION_RETENTION_DAYS_PAST_EXPIRY);

    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, cutoff))
      .returning({ id: sessions.id });

    return NextResponse.json({ deleted: result.length }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Failed to delete old session files' },
      { status: 500 },
    );
  }
}
