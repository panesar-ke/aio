import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import db from '@/drizzle/db';
import {
  itLicenseRenewals,
  itLicenses,
  LICENSE_STATUS,
} from '@/drizzle/schema';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

const licenseSearchParamsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', ...LICENSE_STATUS]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });
    const searchParams = request.nextUrl.searchParams;
    const results = licenseSearchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!results.success) {
      return NextResponse.json(
        { message: 'Invalid search parameters' },
        { status: 422 },
      );
    }

    const filters: Array<SQL> = [];
    const { search, status } = results.data;

    if (status && status !== 'all') {
      filters.push(eq(itLicenses.status, status));
    }

    if (search) {
      const searchFilters = or(
        ilike(itLicenses.name, `%${search}%`),
        ilike(itLicenses.softwareName, `%${search}%`),
        ilike(sql`CAST(${itLicenses.licenseType} AS TEXT)`, `%${search}%`),
        ilike(sql`CAST(${itLicenses.status} AS TEXT)`, `%${search}%`),
      );
      if (searchFilters) filters.push(searchFilters);
    }

    const latestRenewals = db
      .selectDistinctOn([itLicenseRenewals.licenseId], {
        licenseId: itLicenseRenewals.licenseId,
        renewalDate: itLicenseRenewals.renewalDate,
        endDate: itLicenseRenewals.endDate,
      })
      .from(itLicenseRenewals)
      .orderBy(itLicenseRenewals.licenseId, desc(itLicenseRenewals.createdAt))
      .as('latest_renewals');

    const result = await db
      .select({
        id: itLicenses.id,
        name: itLicenses.name,
        licenseType: itLicenses.licenseType,
        status: itLicenses.status,
        latestRenewalDate: latestRenewals.renewalDate,
        latestEndDate: latestRenewals.endDate,
      })
      .from(itLicenses)
      .leftJoin(latestRenewals, eq(itLicenses.id, latestRenewals.licenseId))
      .where(and(...filters))
      .orderBy(desc(latestRenewals.endDate));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(error);
    return NextResponse.json(
      { message: 'Failed to fetch licenses' },
      { status: 500 },
    );
  }
}
