export const SALUTATIONS = [
  'mr',
  'mrs',
  'ms',
  'dr',
  'sir',
  'prof',
  'other',
] as const;

export const LEAD_STATUS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'lost', label: 'Lost' },
] as const;

export const LEAD_SOURCE = [
  {
    value: 'website',
    label: 'Website',
  },
  {
    value: 'advertisement',
    label: 'Advertisement',
  },
  {
    value: 'referal',
    label: 'Referal',
  },
  {
    value: 'walk-in',
    label: 'Walk-in',
  },
  {
    value: 'social',
    label: 'Social',
  },
  {
    value: 'event',
    label: 'Event',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

export const ACCOUNT_TIERS = [
  {
    value: 'low',
    label: 'Low',
  },
  {
    value: 'medium',
    label: 'Medium',
  },
  {
    value: 'high',
    label: 'High',
  },
] as const;

export const LAST_PURCHASE = [
  {
    value: '30',
    label: 'Purchased in last 30 days',
  },
  {
    value: '90',
    label: 'Purchased in last 90 days',
  },
  {
    value: 'dormant',
    label: 'Dormant (12+ months)',
  },
] as const;
