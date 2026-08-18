import { describe, expect, it } from 'vitest';

import {
  getRevocableSessionIds,
  isSessionSelectable,
} from '@/features/admin/components/active-sessions/selection';

describe('active session selection helpers', () => {
  it('filters the current session out of bulk revocation ids', () => {
    expect(
      getRevocableSessionIds(
        {
          'current-session': true,
          'other-session': true,
        },
        'current-session',
      ),
    ).toEqual(['other-session']);
  });

  it('marks the current session row as non-selectable', () => {
    expect(isSessionSelectable('current-session', 'current-session')).toBe(
      false,
    );
    expect(isSessionSelectable('other-session', 'current-session')).toBe(true);
  });
});
