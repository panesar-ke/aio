import db from '@/drizzle/db';
import { cncJobTracker } from '@/drizzle/schema';
import { reportFilterSchema } from '@/features/production/cnc/utils/schema';
import { and, asc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = {
    status: searchParams.get('status'),
    dateRange: {
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    },
  };
  const { data: parsedData, success } = reportFilterSchema.safeParse(params);
  if (!success) throw new Error('Please check your filters and try again!');
  const {
    status,
    dateRange: { from, to },
  } = parsedData;

  const filters: Array<SQL> = [];
  if (status && status !== 'all') {
    filters.push(eq(cncJobTracker.status, status));
  }
  if (from) {
    filters.push(gte(cncJobTracker.startDate, from));
  }
  if (to) {
    filters.push(lte(cncJobTracker.startDate, to));
  }

  const results = await db.query.cncJobTracker.findMany({
    columns: { createdAt: false, updatedAt: false, createdBy: false },
    where: and(...filters),
    orderBy: asc(cncJobTracker.startDate),
  });
  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
