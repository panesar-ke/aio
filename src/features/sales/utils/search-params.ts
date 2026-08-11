import { createLoader, parseAsString, parseAsStringEnum } from 'nuqs/server';

export enum LeadStatus {
  all = 'all',
  new = 'new',
  contacted = 'contacted',
  nurturing = 'nurturing',
  qualified = 'qualified',
  unqualified = 'unqualified',
  lost = 'lost',
}

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const leadSearchParams = {
  search: parseAsString.withDefault(''),
  status: parseAsStringEnum<LeadStatus>(Object.values(LeadStatus)).withDefault(
    LeadStatus.all,
  ),
};

export const loadLeadSearchParams = createLoader(leadSearchParams);
