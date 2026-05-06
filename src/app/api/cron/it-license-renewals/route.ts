import { and, desc, eq, inArray } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/drizzle/db';
import {
  itLicenseRenewalReminderEmails,
  itLicenseRenewals,
  itLicenses,
} from '@/drizzle/schema';
import { env } from '@/env/server';
import { dateFormat } from '@/lib/helpers/formatters';
import { sendSubscriptionReminderEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

const REMINDER_OFFSETS_DAYS = [30, 14, 7, 3] as const;

function utcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatUtcDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getCronSecret(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function GET(request: NextRequest) {
  if (env.CRON_SECRET) {
    const token = getCronSecret(request);
    if (!token || token !== env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!env.IT_MANAGER_EMAIL) {
    return NextResponse.json(
      { message: 'IT_MANAGER_EMAIL is not configured' },
      { status: 500 },
    );
  }

  if (!env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { message: 'RESEND_FROM_EMAIL is not configured' },
      { status: 500 },
    );
  }

  const todayUtc = utcDateOnly(new Date());
  const reminderDateMap = new Map<string, number>();
  for (const offsetDays of REMINDER_OFFSETS_DAYS) {
    reminderDateMap.set(
      formatUtcDateOnly(addUtcDays(todayUtc, offsetDays)),
      offsetDays,
    );
  }

  const targetEndDates = Array.from(reminderDateMap.keys());

  const latestRenewals = db
    .selectDistinctOn([itLicenseRenewals.licenseId], {
      licenseId: itLicenseRenewals.licenseId,
      endDate: itLicenseRenewals.endDate,
    })
    .from(itLicenseRenewals)
    .orderBy(itLicenseRenewals.licenseId, desc(itLicenseRenewals.createdAt))
    .as('latest_renewals');

  const licensesDue = await db
    .select({
      licenseId: itLicenses.id,
      licenseName: itLicenses.name,
      endDate: latestRenewals.endDate,
    })
    .from(itLicenses)
    .leftJoin(latestRenewals, eq(itLicenses.id, latestRenewals.licenseId))
    .where(
      and(
        eq(itLicenses.status, 'active'),
        inArray(latestRenewals.endDate, targetEndDates),
      ),
    );

  const errors: Array<{
    licenseId: string;
    endDate: string | null;
    message: string;
  }> = [];

  let processed = 0;
  let sent = 0;
  let skippedAlreadySent = 0;

  for (const due of licensesDue) {
    processed += 1;

    const endDate = due.endDate;
    if (!endDate) continue;

    const daysBefore = reminderDateMap.get(endDate);
    if (!daysBefore) continue;

    const existing = await db.query.itLicenseRenewalReminderEmails.findFirst({
      where: and(
        eq(itLicenseRenewalReminderEmails.licenseId, due.licenseId),
        eq(itLicenseRenewalReminderEmails.endDate, endDate),
        eq(itLicenseRenewalReminderEmails.daysBefore, daysBefore),
      ),
    });

    if (existing) {
      skippedAlreadySent += 1;
      continue;
    }

    const subject = `[Reminder] ${due.licenseName} expires in ${daysBefore} days (${endDate})`;
    const idempotencyKey = `it-license-renewal/${due.licenseId}/${endDate}/${daysBefore}`;

    const { data, error } = await sendSubscriptionReminderEmail({
      to: env.IT_MANAGER_EMAIL,
      subject,
      idempotencyKey,
      subscriptionName: due.licenseName,
      expiryDays: daysBefore,
      expiryDate: dateFormat(endDate, 'long'),
    });

    if (error) {
      errors.push({
        licenseId: due.licenseId,
        endDate,
        message: error.message,
      });
      continue;
    }

    try {
      await db.insert(itLicenseRenewalReminderEmails).values({
        licenseId: due.licenseId,
        endDate,
        daysBefore,
        resendEmailId: data?.id ?? null,
      });
    } catch (insertError) {
      const code = (insertError as { code?: string } | null)?.code ?? null;
      if (code === '23505') {
        skippedAlreadySent += 1;
        continue;
      }

      errors.push({
        licenseId: due.licenseId,
        endDate,
        message:
          insertError instanceof Error ? insertError.message : 'Insert failed',
      });
      continue;
    }

    sent += 1;
  }

  const status = errors.length ? 500 : 200;
  return NextResponse.json(
    { processed, sent, skippedAlreadySent, errors },
    { status },
  );
}
