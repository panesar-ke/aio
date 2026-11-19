export const EXPORT_GROUPS = [
  { key: 'identity', label: 'Personal' },
  { key: 'employment', label: 'Employment' },
  { key: 'statutory', label: 'Statutory' },
  { key: 'banking', label: 'Banking' },
] as const;

export type ExportGroupKey = (typeof EXPORT_GROUPS)[number]['key'];

type ExportColumn = {
  label: string;
  group: ExportGroupKey;
  /** Pre-selected when the dialog opens. */
  default?: boolean;
  /** Only offered to (and accepted from) users with `hr:admin`. */
  sensitive?: boolean;
  /** Excel column width. */
  width: number;
};

// Phone numbers and emails are deliberately absent, matching the list page.
export const EXPORT_COLUMNS = {
  employeeNo: { label: 'Employee No', group: 'identity', default: true, width: 12 },
  payrollNo: { label: 'Payroll No', group: 'identity', default: true, width: 12 },
  fullName: { label: 'Full Name', group: 'identity', default: true, width: 32 },
  gender: { label: 'Gender', group: 'identity', width: 10 },
  maritalStatus: { label: 'Marital Status', group: 'identity', width: 14 },
  nationality: { label: 'Nationality', group: 'identity', width: 16 },
  educationLevel: { label: 'Education Level', group: 'identity', width: 20 },
  idNo: { label: 'ID No', group: 'identity', sensitive: true, width: 14 },
  dob: { label: 'Date of Birth', group: 'identity', sensitive: true, width: 14 },

  department: { label: 'Department', group: 'employment', default: true, width: 22 },
  designation: { label: 'Designation', group: 'employment', default: true, width: 26 },
  employmentType: { label: 'Employment Type', group: 'employment', default: true, width: 16 },
  category: { label: 'Employee Category', group: 'employment', width: 18 },
  status: { label: 'Status', group: 'employment', default: true, width: 12 },
  joiningDate: { label: 'Date Joined', group: 'employment', default: true, width: 14 },
  contractDate: { label: 'Contract Start', group: 'employment', width: 14 },
  contractDuration: { label: 'Contract Duration (months)', group: 'employment', width: 16 },
  expiryDate: { label: 'Contract Expiry', group: 'employment', width: 14 },

  kraPin: { label: 'KRA PIN', group: 'statutory', sensitive: true, width: 14 },
  nssf: { label: 'NSSF No', group: 'statutory', sensitive: true, width: 14 },
  shaNo: { label: 'SHA No', group: 'statutory', sensitive: true, width: 14 },
  nhif: { label: 'NHIF No', group: 'statutory', sensitive: true, width: 14 },

  bankName: { label: 'Bank', group: 'banking', sensitive: true, width: 22 },
  branchName: { label: 'Branch', group: 'banking', sensitive: true, width: 20 },
  accountNo: { label: 'Account No', group: 'banking', sensitive: true, width: 20 },
  accountName: { label: 'Account Name', group: 'banking', sensitive: true, width: 28 },
} as const satisfies Record<string, ExportColumn>;

export type ExportColumnKey = keyof typeof EXPORT_COLUMNS;

export const EXPORT_COLUMN_KEYS = Object.keys(EXPORT_COLUMNS) as Array<ExportColumnKey>;

export const DEFAULT_EXPORT_COLUMNS = EXPORT_COLUMN_KEYS.filter(
  key => 'default' in EXPORT_COLUMNS[key],
);

export function isSensitiveColumn(key: ExportColumnKey) {
  return 'sensitive' in EXPORT_COLUMNS[key];
}
