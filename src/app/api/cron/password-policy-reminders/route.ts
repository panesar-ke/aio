import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/env/server';
import { findUsersNeedingPolicyReminder } from '@/features/auth/services/data';
import {
  isInPolicyReminderWindow,
  parsePolicyDeadline,
  policyDeadlineDays,
} from '@/features/auth/utils/password-policy';
import { policyReminderNotification } from '@/features/auth/utils/policy-notification';
import { createNotifications } from '@/features/global/services/actions';
import { getCronSecret } from '@/lib/cron-token';

export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Server misconfigured: CRON_SECRET is not set' },
        { status: 500 },
      );
    }
  } else {
    const token = getCronSecret(request);
    if (!token || token !== env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  const deadline = parsePolicyDeadline(process.env.PASSWORD_POLICY_DEADLINE);
  const now = new Date();

  if (!isInPolicyReminderWindow(deadline, now)) {
    return NextResponse.json({ notified: 0, skipped: 'outside-window' });
  }

  // Narrowed by isInPolicyReminderWindow, which is false for a null deadline.
  const dueDate = deadline as Date;
  const days = policyDeadlineDays(dueDate, now) as number;

  try {
    const recipients = await findUsersNeedingPolicyReminder(dueDate);
    const notification = policyReminderNotification(dueDate, days);

    // One insert for the whole batch: a round trip per recipient risks the
    // function timeout, and a mid-way failure leaves the run unresumable
    // within its own window. The unique index on
    // (addressed_to, notification_type, event_id) keeps it idempotent, so a
    // re-run inside the window inserts nothing new.
    await createNotifications(
      recipients.map((recipient) => ({
        ...notification,
        userId: recipient.id,
      })),
    );

    return NextResponse.json({ notified: recipients.length, days });
  } catch (error) {
    console.error('Failed to send password policy reminders', { error });

    return NextResponse.json(
      { message: 'Failed to send password policy reminders' },
      { status: 500 },
    );
  }
}
