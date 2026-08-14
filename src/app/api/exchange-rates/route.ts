import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';

import { env } from '@/env/server';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

type ExchangeRateApiResponse = {
  result: 'success' | 'error';
  conversion_rates?: Record<string, number>;
};

class ExchangeRateUnavailableError extends Error {}

/**
 * Fetches the USD -> KES rate from the upstream provider.
 *
 * Deliberately takes no arguments and does no auth: the rate is identical for
 * every user, so one cached upstream call per hour serves the whole app rather
 * than one call per user who opens the sale order form. Callers must do their
 * own permission check before invoking this.
 */
async function getKesPerUsd() {
  'use cache';
  cacheLife('hours');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let res: Response;

  try {
    res = await fetch(
      `https://v6.exchangerate-api.com/v6/${env.EXCHANGE_RATE_API_KEY}/latest/USD`,
      { signal: controller.signal },
    );
  } catch {
    throw new ExchangeRateUnavailableError(
      'Exchange rate provider request failed',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new ExchangeRateUnavailableError(
      `Exchange rate provider responded with ${res.status}`,
    );
  }

  const data: ExchangeRateApiResponse = await res.json();
  const kesPerUsd = data.conversion_rates?.KES;

  if (
    data.result !== 'success' ||
    typeof kesPerUsd !== 'number' ||
    !Number.isFinite(kesPerUsd) ||
    kesPerUsd <= 0
  ) {
    throw new ExchangeRateUnavailableError(
      'Exchange rate provider returned no usable KES rate',
    );
  }

  return kesPerUsd;
}

export async function GET() {
  try {
    // Gated so the route cannot be used as an open proxy against our upstream
    // quota by anyone who finds the URL.
    await requireAnyPermission(['sales:admin', 'sales:standard'], {
      mode: 'api',
    });

    return NextResponse.json({ kesPerUsd: await getKesPerUsd() });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof ExchangeRateUnavailableError) {
      console.error(error);
      return NextResponse.json(
        { message: 'Exchange rate provider unavailable' },
        { status: 502 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { message: 'Failed to fetch exchange rates' },
      { status: 500 },
    );
  }
}
