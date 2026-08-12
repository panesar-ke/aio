import { describe, expect, it } from 'vitest';

import { getAccountIdentity } from '@/features/sales/components/accounts/accounts-page';

describe('getAccountIdentity', () => {
  it('hides the secondary line when company and name normalize to the same value', () => {
    expect(getAccountIdentity('  acme ltd ', 'Acme Ltd')).toEqual({
      formattedCompany: 'Acme Ltd',
      formattedName: 'Acme Ltd',
      showSecondaryName: false,
    });
  });

  it('shows the secondary line when company and name differ', () => {
    expect(getAccountIdentity('acme ltd', 'jane doe')).toEqual({
      formattedCompany: 'Acme Ltd',
      formattedName: 'Jane Doe',
      showSecondaryName: true,
    });
  });
});
