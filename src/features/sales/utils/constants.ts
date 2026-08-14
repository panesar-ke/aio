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

export const FURNITURE_CATEGORIES = [
  {
    value: 'accessories',
    label: 'Accessories',
  },
  {
    value: 'baristo',
    label: 'Baristo',
  },
  {
    value: 'bedroom',
    label: 'Bedroom',
  },
  {
    value: 'cabinet',
    label: 'Cabinet',
  },
  {
    value: 'consoles',
    label: 'Consoles',
  },
  {
    value: 'dining',
    label: 'Dining',
  },
  {
    value: 'joinery',
    label: 'Joinery',
  },
  {
    value: 'kitchen',
    label: 'Kitchen',
  },
  {
    value: 'living',
    label: 'Living',
  },
  {
    value: 'office',
    label: 'Office',
  },
  {
    value: 'tables',
    label: 'Tables',
  },
];

export const SALE_ORDER_STATUS = [
  'draft',
  'fulfilled',
  'partially fulfilled',
  'cancelled',
] as const;

export const SALE_ORDER_STATUS_LABELS = {
  'draft': 'Pending',
  'fulfilled': 'Fulfilled',
  'partially fulfilled': 'Partially Fulfilled',
  'cancelled': 'Cancelled',
} as const satisfies Record<(typeof SALE_ORDER_STATUS)[number], string>;
