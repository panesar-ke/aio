export const CURRENT_POLICY_VERSION = 1;
export const MIN_PASSWORD_LENGTH = 12;

export type PolicyUser = {
  name: string;
  email: string | null;
  contact: string;
};

export type PolicyFailure =
  | 'too-short'
  | 'contains-personal-data'
  | 'blocklisted';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

const BLOCKLIST = ['password', 'panesar', 'aio', 'qwerty', 'letmein', 'admin'];

const RUNS = [
  'abcdefghijklmnopqrstuvwxyz',
  '01234567890',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

/** Personal fragments worth blocking, four characters or longer. */
function personalFragments(user: PolicyUser) {
  const fragments = [
    ...user.name.split(/\s+/),
    user.email ? user.email.split('@')[0] : '',
    user.contact,
  ];

  return fragments
    .map((fragment) => fragment.trim().toLowerCase())
    .filter((fragment) => fragment.length >= 4);
}

function containsRun(lowered: string) {
  return RUNS.some((run) => {
    for (let i = 0; i + 6 <= run.length; i++) {
      if (lowered.includes(run.slice(i, i + 6))) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Length plus a personal-data and junk blocklist, per NIST 800-63B.
 * Deliberately no required character classes: they push users toward
 * predictable patterns like `Panesar@2026` that satisfy every rule.
 */
export function checkPasswordPolicy(
  password: string,
  user: PolicyUser,
): Array<PolicyFailure> {
  const failures: Array<PolicyFailure> = [];
  const lowered = password.toLowerCase();

  if (password.length < MIN_PASSWORD_LENGTH) {
    failures.push('too-short');
  }

  if (personalFragments(user).some((fragment) => lowered.includes(fragment))) {
    failures.push('contains-personal-data');
  }

  const isRepeatedCharacter =
    password.length > 0 && new Set(lowered).size === 1;

  if (
    BLOCKLIST.some((word) => lowered.includes(word)) ||
    isRepeatedCharacter ||
    containsRun(lowered)
  ) {
    failures.push('blocklisted');
  }

  return failures;
}

export function policyFailureMessage(failure: PolicyFailure) {
  switch (failure) {
    case 'too-short':
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    case 'contains-personal-data':
      return 'Password must not contain your name, email or phone number';
    case 'blocklisted':
      return 'Password is too easy to guess. Try a phrase of unrelated words';
  }
}

export function isPolicyCompliant(version: number | null) {
  return (version ?? 0) >= CURRENT_POLICY_VERSION;
}

/** Advisory only — the gate is `checkPasswordPolicy`. */
export function passwordStrength(password: string): PasswordStrength {
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;

  const score = Math.floor(password.length / 6) + variety;

  if (password.length < MIN_PASSWORD_LENGTH || score <= 2) {
    return 'weak';
  }
  if (score <= 4) {
    return 'fair';
  }
  if (score <= 5) {
    return 'good';
  }
  return 'strong';
}

export function shouldGate(input: {
  compliant: boolean;
  deadline: Date | null;
  exemptUntil: Date | null;
  now: Date;
}) {
  if (input.compliant || input.deadline === null) {
    return false;
  }

  if (input.now.getTime() < input.deadline.getTime()) {
    return false;
  }

  if (
    input.exemptUntil !== null &&
    input.now.getTime() < input.exemptUntil.getTime()
  ) {
    return false;
  }

  return true;
}
