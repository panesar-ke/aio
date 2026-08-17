'use client';

import type { Route } from 'next';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { releasePolicyGateAction } from '@/features/change-password/services/action';

/**
 * Checks once, on arrival at the change-password page, whether the policy gate
 * that sent the user here still applies. An exemption granted after they were
 * already gated only reaches them this way — see releasePolicyGateAction.
 *
 * Renders nothing and never reports failure: if the check does not go through,
 * the user simply stays on the page and changes their password as before.
 */
export function PolicyGateRelease() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    releasePolicyGateAction()
      .then((result) => {
        if (!cancelled && result) {
          router.replace(result.destination as Route);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
