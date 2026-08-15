import { describe, expect, it } from 'vitest';

import {
  checkPasswordPolicy,
  CURRENT_POLICY_VERSION,
  isPolicyCompliant,
  passwordStrength,
  shouldGate,
} from '@/features/auth/utils/password-policy';

const user = {
  name: 'John Smith',
  email: 'jsmith@panesar.co.ke',
  contact: '0712345678',
};

describe('checkPasswordPolicy', () => {
  it('accepts a long unrelated password', () => {
    expect(checkPasswordPolicy('marble-tractor-window', user)).toEqual([]);
  });

  it('rejects anything shorter than 12 characters', () => {
    expect(checkPasswordPolicy('Short1234!', user)).toContain('too-short');
  });

  it('accepts exactly 12 characters', () => {
    expect(checkPasswordPolicy('marble-tract', user)).toEqual([]);
  });

  it('rejects a password containing the surname', () => {
    expect(checkPasswordPolicy('smithsmithsmith', user)).toContain(
      'contains-personal-data',
    );
  });

  it('rejects a password containing the email local part', () => {
    expect(checkPasswordPolicy('jsmith-is-great', user)).toContain(
      'contains-personal-data',
    );
  });

  it('rejects a password containing the contact number', () => {
    expect(checkPasswordPolicy('my0712345678pass', user)).toContain(
      'contains-personal-data',
    );
  });

  it('is case-insensitive about personal data', () => {
    expect(checkPasswordPolicy('JSMITHisgreat', user)).toContain(
      'contains-personal-data',
    );
  });

  it('rejects blocklisted words regardless of case', () => {
    expect(checkPasswordPolicy('PanesarPanesar', user)).toContain(
      'blocklisted',
    );
    expect(checkPasswordPolicy('passwordpassword', user)).toContain(
      'blocklisted',
    );
  });

  it('rejects a single repeated character', () => {
    expect(checkPasswordPolicy('aaaaaaaaaaaaaa', user)).toContain(
      'blocklisted',
    );
  });

  it('rejects keyboard and alphabet runs', () => {
    expect(checkPasswordPolicy('qwertyuiopasdf', user)).toContain(
      'blocklisted',
    );
    expect(checkPasswordPolicy('abcdefghijklmn', user)).toContain(
      'blocklisted',
    );
  });

  it('does not require any character classes', () => {
    // Deliberately all-lowercase, no digits, no symbols.
    expect(checkPasswordPolicy('correcthorsebatterystaple', user)).toEqual([]);
  });

  it('tolerates a null email', () => {
    expect(
      checkPasswordPolicy('marble-tractor-window', { ...user, email: null }),
    ).toEqual([]);
  });

  it('reports every failure at once', () => {
    expect(checkPasswordPolicy('smith', user).sort()).toEqual(
      ['contains-personal-data', 'too-short'].sort(),
    );
  });
});

describe('isPolicyCompliant', () => {
  it('is false for the default version', () => {
    expect(isPolicyCompliant(0)).toBe(false);
  });

  it('is true at the current version', () => {
    expect(isPolicyCompliant(CURRENT_POLICY_VERSION)).toBe(true);
  });

  it('is true above the current version', () => {
    expect(isPolicyCompliant(CURRENT_POLICY_VERSION + 1)).toBe(true);
  });

  it('treats null as non-compliant', () => {
    expect(isPolicyCompliant(null)).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('rates a short password weak', () => {
    expect(passwordStrength('abc')).toBe('weak');
  });

  it('rates a long varied password strong', () => {
    expect(passwordStrength('Marble-Tractor-Window-99')).toBe('strong');
  });

  it('never throws on an empty string', () => {
    expect(passwordStrength('')).toBe('weak');
  });
});

describe('shouldGate', () => {
  const now = new Date('2026-10-20T00:00:00.000Z');
  const past = new Date('2026-10-15T00:00:00.000Z');
  const future = new Date('2026-11-15T00:00:00.000Z');

  it('never gates a compliant user', () => {
    expect(
      shouldGate({ compliant: true, deadline: past, exemptUntil: null, now }),
    ).toBe(false);
  });

  it('never gates when no deadline is configured', () => {
    expect(
      shouldGate({ compliant: false, deadline: null, exemptUntil: null, now }),
    ).toBe(false);
  });

  it('does not gate before the deadline', () => {
    expect(
      shouldGate({ compliant: false, deadline: future, exemptUntil: null, now }),
    ).toBe(false);
  });

  it('gates a non-compliant user after the deadline', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: null, now }),
    ).toBe(true);
  });

  it('honours an unexpired exemption', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: future, now }),
    ).toBe(false);
  });

  it('ignores an expired exemption', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: past, now }),
    ).toBe(true);
  });
});
