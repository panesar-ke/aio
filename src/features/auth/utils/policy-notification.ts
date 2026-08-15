export const POLICY_NOTIFICATION_TYPE = 'PASSWORD_POLICY';

/**
 * Deadlines are stored as UTC but read by people in Nairobi, and a deadline
 * set to local midnight lands the previous evening in UTC. Formatting in the
 * server's timezone would tell those users a date a day early.
 */
function formatPolicyDeadline(deadline: Date) {
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'long',
  }).format(deadline);
}

/** Sent once per deadline, the first time an affected user signs in. */
export function policyDeadlineNotification(deadline: Date) {
  return {
    title: 'Password update required',
    message: `Your password does not meet the current password policy. Update it by ${formatPolicyDeadline(deadline)} to keep working without interruption.`,
    path: '/change-password',
    notificationType: POLICY_NOTIFICATION_TYPE,
    eventId: `deadline-${deadline.toISOString()}`,
  };
}

/** Sent once per deadline by the reminder job, in the final week. */
export function policyReminderNotification(deadline: Date, days: number) {
  return {
    title: 'Password update due soon',
    message: `Your password must be updated within ${days} day${days === 1 ? '' : 's'}, by ${formatPolicyDeadline(deadline)}. After that you will be asked to change it before you can continue.`,
    path: '/change-password',
    notificationType: POLICY_NOTIFICATION_TYPE,
    eventId: `reminder-${deadline.toISOString()}`,
  };
}
