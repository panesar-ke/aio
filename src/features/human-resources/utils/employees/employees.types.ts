export const EXIT_STATUSES = ['TERMINATED', 'RESIGNED', 'RETIRED', 'DECEASED'] as const;

export type EmployeeDisplayStatus = 'ACTIVE' | 'ON_LEAVE' | (typeof EXIT_STATUSES)[number];

export type EmployeeStatusTab = 'ALL' | 'ACTIVE' | 'ON_LEAVE' | 'EXITED';

export const STATUS_TABS: ReadonlyArray<{ value: EmployeeStatusTab; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'EXITED', label: 'Exited' },
];

export const STATUS_LABELS: Record<EmployeeDisplayStatus, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
  RESIGNED: 'Resigned',
  RETIRED: 'Retired',
  DECEASED: 'Deceased',
};

export function isExited(status: EmployeeDisplayStatus) {
  return status !== 'ACTIVE' && status !== 'ON_LEAVE';
}

export type EmployeeRow = {
  id: number;
  name: string;
  payrollNo: string | null;
  department: string;
  designation: string;
  employmentType: string | null;
  joiningDate: string | null;
  tenure: string | null;
  status: EmployeeDisplayStatus;
};

export type EmployeeStats = {
  total: number;
  active: number;
  onLeave: number;
  onContract: number;
};

/** The status shown in the UI: an active employee on approved leave today is ON_LEAVE. */
export function deriveDisplayStatus(
  dbStatus: 'ACTIVE' | (typeof EXIT_STATUSES)[number],
  onLeaveToday: boolean,
): EmployeeDisplayStatus {
  if (dbStatus !== 'ACTIVE') return dbStatus;
  return onLeaveToday ? 'ON_LEAVE' : 'ACTIVE';
}
