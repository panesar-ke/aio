import { CustomAlert } from '@/components/custom/custom-alert';

/**
 * Presentational only. The caller resolves the countdown, because reading the
 * clock is a per-request effect that does not belong in a component body.
 */
export function PasswordPolicyBanner({ days }: { days: number | null }) {
  const description =
    days === null
      ? 'Your password does not meet the current policy. Update it from Change Password.'
      : `Your password does not meet the current policy. Update it within ${days} day${days === 1 ? '' : 's'} to avoid being locked out.`;

  return <CustomAlert variant='warning' description={description} />;
}

export function policyDeadlineDays(deadline: Date | null, now: Date) {
  if (!deadline) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  );
}
