import type { ActionResult } from '@/lib/actions/types';

export function redirectActionResult<T = undefined>(
  redirectTo: string,
  message: string,
  data?: T
): ActionResult<T> {
  return {
    error: false,
    message,
    data,
    redirectTo,
  };
}
