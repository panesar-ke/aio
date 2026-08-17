import { describe, expect, it } from 'vitest';

import {
  policyDeadlineNotification,
  policyReminderNotification,
} from '@/features/auth/utils/policy-notification';

describe('policyDeadlineNotification', () => {
  it('renders the deadline in Nairobi time, not the server timezone', () => {
    // 21:00 UTC is already the next day in EAT. Formatting in UTC would tell
    // the user the 31st when their deadline is really the 1st.
    const deadline = new Date('2026-10-31T21:00:00.000Z');

    expect(policyDeadlineNotification(deadline).message).toContain(
      '1 November 2026',
    );
    expect(policyDeadlineNotification(deadline).message).not.toContain(
      '31 October',
    );
  });

  it('points at the change-password page', () => {
    const notification = policyDeadlineNotification(
      new Date('2026-11-01T00:00:00.000Z'),
    );

    expect(notification.path).toBe('/change-password');
    expect(notification.notificationType).toBe('PASSWORD_POLICY');
  });

  it('keys the event on the deadline so a new date re-announces', () => {
    expect(
      policyDeadlineNotification(new Date('2026-11-01T00:00:00.000Z')).eventId,
    ).toBe('deadline-2026-11-01T00:00:00.000Z');
    expect(
      policyDeadlineNotification(new Date('2026-12-01T00:00:00.000Z')).eventId,
    ).toBe('deadline-2026-12-01T00:00:00.000Z');
  });
});

describe('policyReminderNotification', () => {
  const deadline = new Date('2026-11-01T00:00:00.000Z');

  it('counts the days remaining', () => {
    expect(policyReminderNotification(deadline, 7).message).toContain(
      'within 7 days',
    );
  });

  it('does not pluralise a single day', () => {
    expect(policyReminderNotification(deadline, 1).message).toContain(
      'within 1 day,',
    );
  });

  it('uses an event id distinct from the announcement', () => {
    expect(policyReminderNotification(deadline, 7).eventId).toBe(
      'reminder-2026-11-01T00:00:00.000Z',
    );
  });
});
