'use server';
import { and, desc, eq, gte, lte, ne, or, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import db from '@/drizzle/db';
import { itLicenseRenewals, itLicenses } from '@/drizzle/schema';
import {
  licenseFormSchemaValues,
  licenseRenewalFormSchema,
} from '@/features/it/licenses/utils/schemas';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import { dateFormat } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';
import {
  normalizeNullableString,
  normalizeString,
} from '@/lib/string-normalizers';

export const upsertLicenseDetails = async (values: unknown) =>
  runAction('upsert license details', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);

    const data = parseOrFail(licenseFormSchemaValues, values);

    try {
      const id = await db.transaction(async tx => {
        const licensePayload = {
          name: normalizeString(data.name),
          softwareName: normalizeString(data.softwareName),
          licenseType: data.licenseType,
          status: data.status,
        } as const;

        const licenseRows = data.id
          ? await tx
              .update(itLicenses)
              .set(licensePayload)
              .where(eq(itLicenses.id, data.id))
              .returning({ id: itLicenses.id })
          : await tx
              .insert(itLicenses)
              .values(licensePayload)
              .returning({ id: itLicenses.id });

        const licenseId = licenseRows[0]?.id;
        if (!licenseId) {
          return '__NOT_FOUND__' as const;
        }

        const latestRenewalRows = await tx
          .select({ id: itLicenseRenewals.id })
          .from(itLicenseRenewals)
          .where(eq(itLicenseRenewals.licenseId, licenseId))
          .orderBy(desc(itLicenseRenewals.createdAt))
          .limit(1);

        const latestRenewalId = latestRenewalRows[0]?.id ?? null;
        const licenseKeyValue = normalizeNullableString(data.licenseKey);
        const normalizedLicenseKey = licenseKeyValue
          ? licenseKeyValue.toLowerCase()
          : null;

        if (normalizedLicenseKey) {
          const existingRows = await tx
            .select({ id: itLicenseRenewals.id })
            .from(itLicenseRenewals)
            .where(
              and(
                eq(
                  sql`lower(${itLicenseRenewals.licenseKey})`,
                  normalizedLicenseKey,
                ),
                latestRenewalId
                  ? ne(itLicenseRenewals.id, latestRenewalId)
                  : undefined,
              ),
            )
            .limit(1);

          if (existingRows[0]) {
            return '__LICENSE_KEY_EXISTS__' as const;
          }
        }

        const renewalPayload = {
          vendorId: data.vendorId,
          startDate:
            data.licenseType === 'subscription'
              ? data.startDate
                ? dateFormat(data.startDate)
                : null
              : null,
          endDate:
            data.licenseType === 'subscription'
              ? data.endDate
                ? dateFormat(data.endDate)
                : null
              : null,
          renewalCost:
            data.licenseType === 'subscription'
              ? data.renewalCost
                ? data.renewalCost.toString()
                : null
              : null,
          renewalDate:
            data.licenseType === 'subscription'
              ? data.renewalDate
                ? dateFormat(data.renewalDate)
                : null
              : null,
          totalSeats: data.totalSeats,
          usedSeats: data.usedSeats,
          licenseKey: normalizeNullableString(data.licenseKey),
          notes: normalizeNullableString(data.notes),
        } as const;

        if (latestRenewalId) {
          await tx
            .update(itLicenseRenewals)
            .set(renewalPayload)
            .where(eq(itLicenseRenewals.id, latestRenewalId));
        } else {
          await tx.insert(itLicenseRenewals).values({
            licenseId,
            ...renewalPayload,
          });
        }

        return licenseId;
      });

      if (id === '__NOT_FOUND__') {
        return { error: true, message: 'License not found.' };
      }

      if (id === '__LICENSE_KEY_EXISTS__') {
        return { error: true, message: 'License key already exists.' };
      }

      revalidateTag(`licenses-${id}`);

      return {
        error: false,
        message: `License ${data.id ? 'updated' : 'created'} successfully.`,
        data: { id },
      };
    } catch (error) {
      throw error;
    }
  });

export const renewLicense = async (values: unknown) =>
  runAction('renew license', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);

    const data = parseOrFail(licenseRenewalFormSchema, values);

    const license = await db.query.itLicenses.findFirst({
      where: eq(itLicenses.id, data.licenseId),
    });

    if (!license) {
      return {
        error: true,
        message: 'License not found.',
      };
    }

    if (!data.startDate || !data.endDate) {
      return {
        error: true,
        message: 'Renewal dates are required.',
      };
    }

    const overlapping = await db.query.itLicenseRenewals.findFirst({
      where: and(
        eq(itLicenseRenewals.licenseId, data.licenseId),
        or(
          lte(itLicenseRenewals.startDate, data.endDate),
          gte(itLicenseRenewals.endDate, data.startDate),
        ),
      ),
    });

    if (overlapping) {
      return {
        error: true,
        message: 'Renewal period overlaps with an existing renewal.',
      };
    }

    try {
      const [{ id }] = await db
        .insert(itLicenseRenewals)
        .values({
          licenseId: data.licenseId,
          vendorId: data.vendorId,
          startDate: dateFormat(data.startDate),
          endDate: dateFormat(data.endDate),
          renewalCost: data.renewalCost?.toString(),
          renewalDate: data.renewalDate ? dateFormat(data.renewalDate) : null,
          totalSeats: data.totalSeats,
          usedSeats: data.usedSeats,
          licenseKey: normalizeNullableString(data.licenseKey),
          notes: normalizeNullableString(data.notes),
        })
        .returning({ id: itLicenseRenewals.id });

      revalidateTag(`licenses-${data.licenseId}`);

      return {
        error: false,
        message: `License renewed successfully.`,
        data: { id },
      };
    } catch (error) {
      throw error;
    }
  });
