import { describe, expect, it } from 'vitest';

import {
  loadSalesDashboardSearchParams,
  loadSalesOrderSearchParams,
} from '@/features/sales/utils/search-params';
import { getFinancialYearStart } from '@/lib/helpers/dates';

describe('loadSalesDashboardSearchParams', () => {
  it('defaults the dashboard to the current financial year with no sales person selected', async () => {
    await expect(
      loadSalesDashboardSearchParams(Promise.resolve({})),
    ).resolves.toEqual({
      financialYear: getFinancialYearStart().toString(),
      salesPerson: '',
    });
  });
});

describe('loadSalesOrderSearchParams', () => {
  it('keeps the existing sales order defaults unchanged', async () => {
    await expect(loadSalesOrderSearchParams(Promise.resolve({}))).resolves.toEqual(
      {
        account: '',
        from: null,
        salesPerson: '',
        search: '',
        to: null,
      },
    );
  });
});
