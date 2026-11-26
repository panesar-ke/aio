import { describe, expect, it } from 'vitest';

import {
  buildLeaveDecisionSms,
  pickSmsNumber,
} from '@/features/human-resources/utils/leave/notification';

describe('pickSmsNumber', () => {
  it('returns the first usable number in international form', () => {
    expect(pickSmsNumber([null, '', '0722 123 456', '0733123456'])).toBe(
      '+254722123456',
    );
    expect(pickSmsNumber(['254110123456'])).toBe('+254110123456');
  });

  it('skips numbers that cannot receive an SMS', () => {
    expect(pickSmsNumber(['020 1234567', '+254722123456'])).toBe(
      '+254722123456',
    );
    expect(pickSmsNumber(['n/a', undefined])).toBeNull();
  });
});

describe('buildLeaveDecisionSms', () => {
  const leave = {
    otherNames: 'MICHAEL JOSEPH',
    leaveNo: 12,
    leaveType: 'annual leave',
    startDate: '2026-11-27',
    endDate: '2026-11-27',
    resumeDate: '2026-11-28',
    daysTaken: 1,
  };

  it('tells an approved employee when to resume', () => {
    expect(buildLeaveDecisionSms({ ...leave, status: 'APPROVED' })).toBe(
      'Dear Michael, your annual leave (No. 12) from 27 Nov 2026 to 27 Nov 2026 (1 day) has been approved. Resume work on 28 Nov 2026.',
    );
  });

  it('refers a rejected employee to HR', () => {
    expect(
      buildLeaveDecisionSms({
        ...leave,
        leaveType: 'maternity',
        daysTaken: 2.5,
        status: 'REJECTED',
      }),
    ).toBe(
      'Dear Michael, your maternity leave (No. 12) from 27 Nov 2026 to 27 Nov 2026 (2.5 days) has been rejected. Please contact HR for details.',
    );
  });
});
