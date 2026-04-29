import type { Metadata } from 'next';

import { desc, eq } from 'drizzle-orm';
import { unstable_cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';

import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';
import db from '@/drizzle/db';
import { itLicenseRenewals, itLicenses } from '@/drizzle/schema';
import { LicenseRenewalHistory } from '@/features/it/licenses/components/license-renewal-history';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'License Renewal History',
};

async function getLicense(id: string) {
  'use cache';
  unstable_cacheTag(`licenses-${id}`);

  const license = await db.query.itLicenses.findFirst({
    where: eq(itLicenses.id, id),
  });

  if (!license) notFound();

  const licenseRenewals = await db.query.itLicenseRenewals.findMany({
    with: { vendor: { columns: { vendorName: true } } },
    where: eq(itLicenseRenewals.licenseId, id),
    orderBy: desc(itLicenseRenewals.createdAt),
  });

  const normalizedRenewals = licenseRenewals.map(renewal => ({
    id: renewal.id,
    vendorName: titleCase(renewal.vendor.vendorName),
    licenseKey: renewal.licenseKey,
    totalSeats: renewal.totalSeats,
    usedSeats: renewal.usedSeats,
    startDate: renewal.startDate,
    endDate: renewal.endDate,
    renewalCost: renewal.renewalCost,
    renewalDate: renewal.renewalDate,
    notes: renewal.notes,
    createdAt: dateFormat(renewal.createdAt),
  }));

  return { normalizedRenewals, licenseName: license.name };
}

export default async function LicenseHistoryPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = await params;
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const { normalizedRenewals, licenseName } = await getLicense(licenseId);

  return (
    <div className="space-y-6">
      <BackButton variant="link" href="/it/licenses">
        Back to Licenses
      </BackButton>
      <PageHeader
        title="License Renewal History"
        description={`Renewal history for ${licenseName}`}
      />
      <LicenseRenewalHistory renewals={normalizedRenewals} />
    </div>
  );
}
