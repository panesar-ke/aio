import { CustomAlert } from '@/components/custom/custom-alert';

/**
 * Presentational only. The caller decides whether to show this at all and
 * resolves the countdown, because reading the clock is a per-request effect
 * that does not belong in a component body.
 */
export function PasswordPolicyBanner({ days }: { days: number }) {
  const description =
    days === 0
      ? 'Your password does not meet the current policy. Update it now to continue working.'
      : `Your password does not meet the current policy. Update it within ${days} day${days === 1 ? '' : 's'} to avoid being locked out.`;

  return <CustomAlert variant='warning' description={description} />;
}
