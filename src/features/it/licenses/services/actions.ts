'use server';
import { and, between, eq, ne, or, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import { itLicenseRenewals, itLicenses } from '@/drizzle/schema';
import {
  licenseFormSchemaValues,
  licenseRenewalFormSchema,
} from '@/features/it/licenses/utils/schemas';
import { runAction } from '@/lib/actions/safe-action';
import { parseOrFail } from '@/lib/actions/safe-action';
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
    if (data.licenseKey) {
      const normalizedName = normalizeString(data.licenseKey);
      const existing = await db.query.itLicenseRenewals.findFirst({
        where: and(
          eq(
            sql`lower(${itLicenseRenewals.licenseKey})`,
            normalizedName.toLowerCase(),
          ),
          data.id ? ne(itLicenseRenewals.id, data.id) : undefined,
        ),
      });

      if (existing) {
        return {
          error: true,
          message: 'License already exists.',
        };
      }
    }

    try {
      const id = await db.transaction(async tx => {
        const [{ id }] = await tx
          .insert(itLicenses)
          .values({
            ...data,
            name: normalizeString(data.name),
            softwareName: normalizeString(data.softwareName),
          })
          .onConflictDoUpdate({
            target: itLicenses.id,
            set: {
              ...data,
              name: normalizeString(data.name),
              softwareName: normalizeString(data.softwareName),
            },
          })
          .returning({ id: itLicenses.id });

        if (data.id) {
          await tx
            .delete(itLicenseRenewals)
            .where(eq(itLicenseRenewals.licenseId, data.id));
        }

        await tx.insert(itLicenseRenewals).values({
          licenseId: id,
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
        });
      });

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
          between(itLicenseRenewals.startDate, data.startDate, data.endDate),
          between(itLicenseRenewals.endDate, data.startDate, data.endDate),
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

      return {
        error: false,
        message: `License renewed successfully.`,
        data: { id },
      };
    } catch (error) {
      throw error;
    }
  });
