import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  buildProductUsageAggregatesQuery,
  isEligibleForDeactivation,
} from '@/features/store/services/product-deactivation/eligibility';

const asOf = new Date('2026-07-31T00:00:00.000Z');
const THRESHOLD = 365;
const dialect = new PgDialect();

describe('isEligibleForDeactivation', () => {
  it('is eligible when real usage exists and is older than the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: new Date('2025-01-01'), createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('is not eligible when real usage exists within the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: new Date('2026-06-01'), createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });

  it('is eligible immediately when there is zero usage and createdOn is null (legacy product)', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('is not eligible when there is zero usage, createdOn is set, and createdOn is within the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: new Date('2026-06-01') },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });

  it('is eligible when there is zero usage, createdOn is set, and createdOn is older than the threshold', () => {
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: null, createdOn: new Date('2025-01-01') },
        THRESHOLD,
        asOf,
      ),
    ).toBe(true);
  });

  it('treats a usage date exactly at the threshold boundary as not yet eligible', () => {
    const boundary = new Date(asOf);
    boundary.setUTCDate(boundary.getUTCDate() - THRESHOLD);
    expect(
      isEligibleForDeactivation(
        { lastUsedDate: boundary, createdOn: null },
        THRESHOLD,
        asOf,
      ),
    ).toBe(false);
  });
});

describe('buildProductUsageAggregatesQuery', () => {
  it('aggregates stock_movements, mrq (via mrq_headers), and orders (via orders_header), excluding auto_order_items', () => {
    const query = dialect.sqlToQuery(buildProductUsageAggregatesQuery());

    expect(query.sql).toContain('"stock_movements"');
    expect(query.sql).toContain('sm.is_deleted = false');
    expect(query.sql).toContain('"mrq_details"');
    expect(query.sql).toContain('"mrq_headers"');
    expect(query.sql).toContain('"orders_details"');
    expect(query.sql).toContain('"orders_header"');
    expect(query.sql).toContain('GREATEST(');
    expect(query.sql).not.toContain('auto_order_items');
  });

  it('restricts to active, stock-item, non-excluded products', () => {
    const query = dialect.sqlToQuery(buildProductUsageAggregatesQuery());

    expect(query.sql).toContain('p.active = true');
    expect(query.sql).toContain('p.stock_item = true');
    expect(query.sql).toContain('p.exclude_from_auto_deactivation = false');
  });

  it('treats a reactivation as a usage signal, so a reactivated product gets a fresh baseline', () => {
    const query = dialect.sqlToQuery(buildProductUsageAggregatesQuery());

    expect(query.sql).toContain('"product_deactivation_items"');
    expect(query.sql).toContain('pdi.reactivated = true');
    expect(query.sql).toContain('pdi.reactivated_on');
    expect(query.sql).toContain(
      'GREATEST(su.last_date, mu.last_date, ou.last_date, ru.last_date)',
    );
  });

  it('normalizes the reactivation timestamp to UTC before truncating to a date', () => {
    const query = dialect.sqlToQuery(buildProductUsageAggregatesQuery());

    expect(query.sql).toContain(
      "MAX(pdi.reactivated_on AT TIME ZONE 'UTC')::date",
    );
  });
});
