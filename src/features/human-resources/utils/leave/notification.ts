import { normalizeKenyanPhone } from '@/features/human-resources/utils/employees/phone';
import {
  formatLeaveDate,
  formatLeaveType,
  formatPersonName,
} from '@/features/human-resources/utils/leave/leave.types';
import { internationalizePhoneNumber } from '@/lib/helpers/formatters';

/** The first usable mobile number, in the +254 form the SMS gateway expects. */
export function pickSmsNumber(candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const local = candidate ? normalizeKenyanPhone(candidate) : null;
    if (local) return internationalizePhoneNumber(local, true);
  }
  return null;
}

export function buildLeaveDecisionSms(leave: {
  otherNames: string;
  leaveNo: number;
  leaveType: string;
  status: 'APPROVED' | 'REJECTED';
  startDate: string;
  endDate: string;
  resumeDate: string;
  daysTaken: number;
}) {
  const firstName = formatPersonName(leave.otherNames).split(' ')[0];
  const type = formatLeaveType(leave.leaveType).toLowerCase();
  const days = `${leave.daysTaken} ${leave.daysTaken === 1 ? 'day' : 'days'}`;
  const outcome =
    leave.status === 'APPROVED'
      ? `approved. Resume work on ${formatLeaveDate(leave.resumeDate)}.`
      : 'rejected. Please contact HR for details.';

  return `Dear ${firstName}, your ${type} leave (No. ${leave.leaveNo}) from ${formatLeaveDate(leave.startDate)} to ${formatLeaveDate(leave.endDate)} (${days}) has been ${outcome}`;
}
