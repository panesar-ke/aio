# Forgot Password & Password Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users a self-service password reset by emailed single-use link, fix the password-casing bug that silently lowercases every password, then enforce a 12-character password policy with a migration path for existing accounts.

**Architecture:** Phase 1 adds two public routes (`/forgot-password`, `/reset-password/[token]`) backed by a `password_reset_tokens` table holding only SHA-256 hashes, plus a self-healing login fallback so case-preserving comparison does not lock out legacy accounts. Phase 2 stamps a `password_policy_version` on every password write, silently stamps compliant users at login, and gates non-compliant users in `proxy.ts` after an env-var deadline.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM (PostgreSQL), zod + react-hook-form, bcryptjs, Resend + react-email, Arcjet, Vitest (Node env).

**Spec:** `docs/superpowers/specs/2026-08-14-forgot-password-design.md`

## Global Constraints

- Two-space indentation, single quotes, semicolons, functional components.
- Kebab-case filenames, PascalCase components, camelCase functions/variables.
- Use the `@/` alias for imports from `src/`. Use `type` imports where applicable.
- Tests live beside the implementation as `<subject>.test.ts`. Vitest runs in a **Node** environment and only discovers `src/**/*.test.ts` — **not** `.test.tsx`. Do not plan React-rendering tests; test the logic underneath instead.
- Run `pnpm test` and `pnpm lint:check` before considering a task done. `pnpm typecheck` runs `tsc --noEmit`.
- Never run `pnpm db:push`. Generate migrations with `pnpm db:generate` and review the SQL before it is applied.
- Commit after each task with a short, imperative, lowercase subject.
- Token TTL is **30 minutes**. Request throttle is **3 per hour per user**. Minimum password length in phase 2 is **12 characters**. `CURRENT_POLICY_VERSION` starts at **1**.
- Exact user-facing copy (do not paraphrase):
  - `No account found for that email or contact.`
  - `That account is deactivated. Contact IT.`
  - `No email address on file for that account. Contact IT.`
  - `Too many reset requests. Try again in an hour.`
  - `Could not send the reset email. Try again shortly.`

## File Structure

**Phase 1 — created**

| File | Responsibility |
|---|---|
| `src/features/auth/utils/password.ts` | `verifyPassword` — case-preserving compare with legacy lowercase fallback |
| `src/features/auth/utils/password.test.ts` | Tests for the above |
| `src/features/auth/utils/reset-token.ts` | Token generation, hashing, TTL/throttle constants, state predicate |
| `src/features/auth/utils/reset-token.test.ts` | Tests for the above |
| `src/features/auth/utils/mask-email.ts` | `maskEmail` for the success message |
| `src/features/auth/utils/mask-email.test.ts` | Tests for the above |
| `src/features/auth/actions/password-reset.ts` | `requestPasswordResetAction`, `resetPasswordAction` |
| `src/features/auth/components/forgot-password-form.tsx` | Identifier form |
| `src/features/auth/components/reset-password-form.tsx` | New-password form |
| `src/app/(auth)/forgot-password/page.tsx` | Public request page |
| `src/app/(auth)/reset-password/[token]/page.tsx` | Public reset page, validates token server-side |

**Phase 1 — modified**

| File | Change |
|---|---|
| `src/lib/schema-rules.ts` | No change; phase 1 switches *callers* to the trimmed variant |
| `src/features/auth/actions/schema.ts` | Case-preserving password, add reset schemas |
| `src/features/auth/actions/auth.ts` | Use `verifyPassword`, re-hash on legacy match |
| `src/features/change-password/utils/schema.ts` | Case-preserving passwords |
| `src/features/auth/components/login-form.tsx:71` | Fix `href` to `/forgot-password` |
| `src/drizzle/schemas/auth.ts` | Add `passwordResetTokens` |
| `src/drizzle/schema.ts` | Export the new schema file |
| `src/drizzle/migrations/schema.ts` | Drop `users.reset_token` |
| `src/features/admin/services/data.ts:34,57` | Remove `resetToken: false` selections |
| `src/env/server.ts` | Add `APP_URL`, `SUPPORT_EMAIL` |
| `src/lib/resend.ts` | Add `sendPasswordResetEmail` |
| `src/proxy.ts` | Prefix matching for public routes |
| `src/proxy.test.ts` | Cover `/reset-password/<token>` |

**Phase 2 — created**

| File | Responsibility |
|---|---|
| `src/features/auth/utils/password-policy.ts` | Policy predicate, strength scoring, version + gate logic |
| `src/features/auth/utils/password-policy.test.ts` | Tests for the above |
| `src/components/custom/password-strength.tsx` | Advisory strength meter |
| `src/components/auth/password-policy-banner.tsx` | Countdown banner |

**Phase 2 — modified**

| File | Change |
|---|---|
| `src/drizzle/migrations/schema.ts` | Add policy columns, drop `prompt_password_change` |
| `src/features/auth/actions/auth.ts` | Silent stamping at login |
| `src/features/auth/actions/password-reset.ts` | Enforce policy, stamp version |
| `src/features/change-password/*` | Enforce policy, stamp version, add meter |
| `src/features/admin/utils/helpers.ts` | `generatePassword` → `crypto.randomInt`, policy-satisfying length |
| `src/features/admin/services/action.ts` | Stop writing `promptPasswordChange` |
| `src/types/index.types.ts` | `policyCompliant` on `SessionPayload` |
| `src/lib/session.ts` | Carry the claim through `createSession` |
| `src/proxy.ts` | Policy gate |
| `src/env/server.ts` | `PASSWORD_POLICY_DEADLINE` |
| `src/app/(protected)/layout.tsx` | Render the banner |

---

# Phase 1 — Reset flow and casing fix

### Task 1: Case-preserving password verification

The bug: `requiredStringSchemaEntry` (`src/lib/schema-rules.ts:14`) chains `.toLowerCase()`, so `loginSchema.parse({ password: 'xY7@2kQz' })` yields `'xy7@2kqz'`. Login and change-password both lowercase, so they agree by accident — but `hashPassword` in the admin flow hashes the raw mixed-case generated password, so an admin-created user whose temporary password contains a capital letter can never log in.

This task makes comparison case-preserving without locking out accounts whose stored hash came from lowercased input.

**Files:**
- Create: `src/features/auth/utils/password.ts`
- Test: `src/features/auth/utils/password.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `verifyPassword(input: string, storedHash: string): Promise<PasswordVerification>` where `PasswordVerification = { ok: false } | { ok: true; needsRehash: boolean }`. Task 2 does not use it; Task 4 (login wiring) does.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/utils/password.test.ts
import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { verifyPassword } from '@/features/auth/utils/password';

// Cost 4 keeps the suite fast; production rounds come from env.BCRYPT_ROUNDS.
const hash = (value: string) => bcrypt.hash(value, 4);

describe('verifyPassword', () => {
  it('accepts a password matching the stored hash exactly', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('CorrectHorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: false,
    });
  });

  it('accepts a legacy hash of lowercased input and asks for a re-hash', async () => {
    // How every hash written through the old change-password form was created.
    const stored = await hash('correcthorse9');

    await expect(verifyPassword('CorrectHorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: true,
    });
  });

  it('does not ask for a re-hash when the password is already lowercase', async () => {
    const stored = await hash('correcthorse9');

    await expect(verifyPassword('correcthorse9', stored)).resolves.toEqual({
      ok: true,
      needsRehash: false,
    });
  });

  it('rejects a genuinely wrong password', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('WrongHorse9', stored)).resolves.toEqual({
      ok: false,
    });
  });

  it('rejects a wrong password that differs only by case from nothing stored', async () => {
    const stored = await hash('CorrectHorse9');

    await expect(verifyPassword('CORRECTHORSE9', stored)).resolves.toEqual({
      ok: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/utils/password.test.ts`
Expected: FAIL — `Failed to resolve import "@/features/auth/utils/password"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/auth/utils/password.ts
import bcrypt from 'bcryptjs';

export type PasswordVerification =
  | { ok: false }
  | { ok: true; needsRehash: boolean };

/**
 * Verifies a password against its stored hash, preserving case.
 *
 * Hashes written before the casing fix are hashes of lowercased input, so a
 * direct comparison would reject the user's real password. When the lowercased
 * variant matches, the caller is told to re-hash the input exactly as typed —
 * each legacy account self-heals on its owner's next login.
 *
 * TRANSITIONAL: the lowercase fallback can be deleted once every active
 * account has logged in at least once after this ships.
 */
export async function verifyPassword(
  input: string,
  storedHash: string
): Promise<PasswordVerification> {
  if (await bcrypt.compare(input, storedHash)) {
    return { ok: true, needsRehash: false };
  }

  const lowercased = input.toLowerCase();
  if (lowercased !== input && (await bcrypt.compare(lowercased, storedHash))) {
    return { ok: true, needsRehash: true };
  }

  return { ok: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/utils/password.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/utils/password.ts src/features/auth/utils/password.test.ts
git commit -m "add case-preserving password verification"
```

---

### Task 2: Reset token helpers

**Files:**
- Create: `src/features/auth/utils/reset-token.ts`
- Test: `src/features/auth/utils/reset-token.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `RESET_TOKEN_TTL_MINUTES` (30), `RESET_TOKEN_REQUEST_LIMIT` (3), `RESET_TOKEN_REQUEST_WINDOW_MINUTES` (60), `generateResetToken(): string`, `hashResetToken(token: string): string`, `resetTokenExpiry(now: Date): Date`, `resetTokenState(row: { expiresAt: Date; usedAt: Date | null }, now: Date): 'valid' | 'expired' | 'used'`, `resetRequestWindowStart(now: Date): Date`. Tasks 6, 7 and 9 consume these.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/utils/reset-token.test.ts
import { describe, expect, it } from 'vitest';

import {
  RESET_TOKEN_REQUEST_LIMIT,
  RESET_TOKEN_REQUEST_WINDOW_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
  generateResetToken,
  hashResetToken,
  resetRequestWindowStart,
  resetTokenExpiry,
  resetTokenState,
} from '@/features/auth/utils/reset-token';

describe('generateResetToken', () => {
  it('produces a URL-safe token with no padding', () => {
    expect(generateResetToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces a different token on every call', () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateResetToken())
    );

    expect(tokens.size).toBe(50);
  });

  it('produces at least 32 bytes of entropy', () => {
    // 32 bytes base64url-encodes to 43 characters.
    expect(generateResetToken().length).toBeGreaterThanOrEqual(43);
  });
});

describe('hashResetToken', () => {
  it('is stable for the same input', () => {
    const token = generateResetToken();

    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it('differs for different inputs', () => {
    expect(hashResetToken('one')).not.toBe(hashResetToken('two'));
  });

  it('never returns the raw token', () => {
    const token = generateResetToken();

    expect(hashResetToken(token)).not.toContain(token);
  });
});

describe('resetTokenExpiry', () => {
  it('is the configured TTL after the given instant', () => {
    const now = new Date('2026-08-14T10:00:00.000Z');

    expect(resetTokenExpiry(now).toISOString()).toBe(
      '2026-08-14T10:30:00.000Z'
    );
    expect(RESET_TOKEN_TTL_MINUTES).toBe(30);
  });
});

describe('resetRequestWindowStart', () => {
  it('is one hour before the given instant', () => {
    const now = new Date('2026-08-14T10:00:00.000Z');

    expect(resetRequestWindowStart(now).toISOString()).toBe(
      '2026-08-14T09:00:00.000Z'
    );
  });

  it('matches the configured window', () => {
    expect(RESET_TOKEN_REQUEST_WINDOW_MINUTES).toBe(60);
    expect(RESET_TOKEN_REQUEST_LIMIT).toBe(3);
  });
});

describe('resetTokenState', () => {
  const now = new Date('2026-08-14T10:00:00.000Z');

  it('is valid when unused and not yet expired', () => {
    const row = { expiresAt: new Date('2026-08-14T10:00:01.000Z'), usedAt: null };

    expect(resetTokenState(row, now)).toBe('valid');
  });

  it('is expired once the expiry instant has passed', () => {
    const row = { expiresAt: new Date('2026-08-14T09:59:59.000Z'), usedAt: null };

    expect(resetTokenState(row, now)).toBe('expired');
  });

  it('is expired exactly at the expiry instant', () => {
    const row = { expiresAt: new Date(now), usedAt: null };

    expect(resetTokenState(row, now)).toBe('expired');
  });

  it('is used when consumed, even if still within the TTL', () => {
    const row = {
      expiresAt: new Date('2026-08-14T10:29:00.000Z'),
      usedAt: new Date('2026-08-14T09:50:00.000Z'),
    };

    expect(resetTokenState(row, now)).toBe('used');
  });

  it('reports used ahead of expired when both apply', () => {
    const row = {
      expiresAt: new Date('2026-08-14T09:00:00.000Z'),
      usedAt: new Date('2026-08-14T08:55:00.000Z'),
    };

    expect(resetTokenState(row, now)).toBe('used');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/utils/reset-token.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/auth/utils/reset-token.ts
import { createHash, randomBytes } from 'node:crypto';

export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_TOKEN_REQUEST_LIMIT = 3;
export const RESET_TOKEN_REQUEST_WINDOW_MINUTES = 60;

export type ResetTokenState = 'valid' | 'expired' | 'used';

/**
 * Crypto-grade token for a reset link. Deliberately not `generatePassword`
 * from the admin helpers — that draws from `Math.random()`.
 */
export function generateResetToken() {
  return randomBytes(32).toString('base64url');
}

/** Only the hash is ever stored, so a leaked backup yields no usable links. */
export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function resetTokenExpiry(now: Date) {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

/** Start of the trailing window the request throttle counts within. */
export function resetRequestWindowStart(now: Date) {
  return new Date(
    now.getTime() - RESET_TOKEN_REQUEST_WINDOW_MINUTES * 60 * 1000
  );
}

export function resetTokenState(
  row: { expiresAt: Date; usedAt: Date | null },
  now: Date
): ResetTokenState {
  if (row.usedAt !== null) {
    return 'used';
  }

  return row.expiresAt.getTime() > now.getTime() ? 'valid' : 'expired';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/utils/reset-token.test.ts`
Expected: PASS — 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/utils/reset-token.ts src/features/auth/utils/reset-token.test.ts
git commit -m "add password reset token helpers"
```

---

### Task 3: Email masking helper

**Files:**
- Create: `src/features/auth/utils/mask-email.ts`
- Test: `src/features/auth/utils/mask-email.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `maskEmail(email: string): string`. Task 7 consumes it.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/utils/mask-email.test.ts
import { describe, expect, it } from 'vitest';

import { maskEmail } from '@/features/auth/utils/mask-email';

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('jsmith@panesar.co.ke')).toBe('j••••@panesar.co.ke');
  });

  it('masks a two-character local part without revealing the second', () => {
    expect(maskEmail('jo@panesar.co.ke')).toBe('j••••@panesar.co.ke');
  });

  it('uses a fixed number of dots so length is not leaked', () => {
    expect(maskEmail('a@x.com')).toBe('a••••@x.com');
    expect(maskEmail('averylonglocalpart@x.com')).toBe('a••••@x.com');
  });

  it('returns the input unchanged when there is no @', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/utils/mask-email.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/auth/utils/mask-email.ts
/**
 * `jsmith@panesar.co.ke` → `j••••@panesar.co.ke`.
 *
 * The dot count is fixed so the mask does not leak the local part's length.
 */
export function maskEmail(email: string) {
  const at = email.indexOf('@');
  if (at < 1) {
    return email;
  }

  return `${email[0]}••••${email.slice(at)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/utils/mask-email.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/utils/mask-email.ts src/features/auth/utils/mask-email.test.ts
git commit -m "add email masking helper"
```

---

### Task 4: Wire case-preserving verification into login

**Files:**
- Modify: `src/features/auth/actions/schema.ts`
- Modify: `src/features/auth/actions/auth.ts`
- Modify: `src/features/change-password/utils/schema.ts`
- Test: `src/features/auth/actions/schema.test.ts` (create)

**Interfaces:**
- Consumes: `verifyPassword` from Task 1.
- Produces: `loginSchema` and `changePasswordSchema` with case-preserving password fields.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/actions/schema.test.ts
import { describe, expect, it } from 'vitest';

import { loginSchema } from '@/features/auth/actions/schema';
import { changePasswordSchema } from '@/features/change-password/utils/schema';

describe('loginSchema', () => {
  it('preserves password case', () => {
    const parsed = loginSchema.parse({
      userName: 'JSmith@Panesar.co.ke',
      password: 'xY7@2kQz',
    });

    expect(parsed.password).toBe('xY7@2kQz');
  });

  it('still lowercases the identifier, which is case-insensitive', () => {
    const parsed = loginSchema.parse({
      userName: 'JSmith@Panesar.co.ke',
      password: 'xY7@2kQz',
    });

    expect(parsed.userName).toBe('jsmith@panesar.co.ke');
  });

  it('rejects an empty password', () => {
    expect(
      loginSchema.safeParse({ userName: 'a@b.com', password: '' }).success
    ).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('preserves case on both password fields', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'NewPass456',
    });

    expect(parsed.currentPassword).toBe('OldPass123');
    expect(parsed.newPassword).toBe('NewPass456');
  });

  it('rejects a confirmation that differs only by case', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'newpass456',
    });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: FAIL — `expected 'xy7@2kqz' to be 'xY7@2kQz'`.

- [ ] **Step 3: Switch the password fields to the trimmed variant**

In `src/features/auth/actions/schema.ts`, import `requiredTrimmedStringSchemaEntry` alongside the existing import and use it for `password` only. The `userName` field keeps `requiredStringSchemaEntry`: emails and phone numbers are case-insensitive, and lowercasing them makes lookup consistent.

```ts
// src/features/auth/actions/schema.ts
import { z } from 'zod';

import {
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Email/contact is required'),
  password: requiredTrimmedStringSchemaEntry('Password is required').min(
    6,
    'Password must be at least 6 characters long'
  ),
});
```

In `src/features/change-password/utils/schema.ts`, replace all three `requiredStringSchemaEntry` calls with `requiredTrimmedStringSchemaEntry`, keeping the messages and the `.superRefine` block exactly as they are.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Use `verifyPassword` in `loginAction`**

Replace the `bcrypt.compare` block in `src/features/auth/actions/auth.ts`. Drop the now-unused `bcrypt` import and add the two new ones.

```ts
// src/features/auth/actions/auth.ts — replacing the isValid block
import { eq } from 'drizzle-orm';

import { users } from '@/drizzle/schema';
import { hashPassword } from '@/features/admin/utils/helpers';
import { verifyPassword } from '@/features/auth/utils/password';

  const verification = await verifyPassword(data.password, user.password);

  if (!verification.ok) {
    return { success: false, message: 'Invalid credentials', status: 401 };
  }

  // TRANSITIONAL: this hash predates the casing fix and is a hash of
  // lowercased input. Re-store it as typed so the account self-heals.
  if (verification.needsRehash) {
    await db
      .update(users)
      .set({ password: await hashPassword(data.password) })
      .where(eq(users.id, user.id));
  }

  await createSession(user.id);
```

- [ ] **Step 6: Verify the whole suite and types still pass**

Run: `pnpm test && pnpm typecheck && pnpm lint:check`
Expected: all pass. If `bcryptjs` is now an unused import in `auth.ts`, remove it — lint will flag it.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/actions/schema.ts src/features/auth/actions/schema.test.ts src/features/auth/actions/auth.ts src/features/change-password/utils/schema.ts
git commit -m "preserve password case with self-healing login"
```

---

### Task 5: Reset token table and migration

**Files:**
- Modify: `src/drizzle/schemas/auth.ts`
- Modify: `src/drizzle/schema.ts`
- Modify: `src/drizzle/migrations/schema.ts` (remove `resetToken` from the `users` table definition)
- Modify: `src/features/admin/services/data.ts:34,57`

**Interfaces:**
- Consumes: nothing.
- Produces: `passwordResetTokens` table with columns `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`. Tasks 7 and 9 query it.

- [ ] **Step 1: Define the table**

`src/drizzle/schemas/auth.ts` is currently commented out in its entirety. **Do not uncomment the `sessions` or `loginAttempts` blocks** — both already exist in `src/drizzle/migrations/schema.ts` and re-declaring them would produce duplicate tables. Replace the whole file with only the new table:

```ts
// src/drizzle/schemas/auth.ts
import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from '@/drizzle/migrations/schema';

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index('password_reset_tokens_user_id_idx').on(table.userId),
  ]
);

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);
```

- [ ] **Step 2: Export it and drop the dead column**

Add to `src/drizzle/schema.ts`:

```ts
export * from '@/drizzle/schemas/auth';
```

In `src/drizzle/migrations/schema.ts`, delete this line from the `users` table (around line 1770):

```ts
    resetToken: text('reset_token'),
```

Then delete the `resetToken: false,` line from both column selections in `src/features/admin/services/data.ts` (lines 34 and 57).

- [ ] **Step 3: Generate the migration**

Run: `pnpm db:generate`
Expected: a new `src/drizzle/migrations/00XX_*.sql`.

- [ ] **Step 4: Review the generated SQL**

Run: `cat src/drizzle/migrations/00XX_*.sql` (the newest file)

It must contain a `CREATE TABLE "password_reset_tokens"`, a foreign key to `users` with `ON DELETE cascade`, a unique constraint on `token_hash`, an index on `user_id`, and `ALTER TABLE "users" DROP COLUMN "reset_token"`. It must contain **no other `DROP`** — if drizzle-kit has picked up unrelated drift, stop and report it rather than applying.

- [ ] **Step 5: Verify types**

Run: `pnpm typecheck`
Expected: PASS. A failure here means something still references `users.resetToken`.

- [ ] **Step 6: Commit**

```bash
git add src/drizzle/ src/features/admin/services/data.ts
git commit -m "add password reset tokens table"
```

---

### Task 6: Email sender and environment

**Files:**
- Modify: `src/env/server.ts`
- Modify: `src/lib/resend.ts`

The email template `src/emails/password-reset.tsx` already exists and takes `name`, `resetUrl`, `logoUrl`, `expiresInMinutes`, and `supportEmail`.

**Interfaces:**
- Consumes: `RESET_TOKEN_TTL_MINUTES` from Task 2; `PasswordResetEmail` from `@/emails/password-reset`.
- Produces: `sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<void>`, throwing on a missing sender address or a Resend error. Task 7 consumes it.

- [ ] **Step 1: Add the environment variables**

In `src/env/server.ts`, add to the `server` object:

```ts
    APP_URL: z.string().url(),
    SUPPORT_EMAIL: z.string().email().default('support@panesars.co.ke'),
```

`APP_URL` is the absolute origin used to build reset links and the email logo URL, for example `https://aio.panesar.co.ke`. Add it to `.env` before running the app, or startup validation will fail with a clear message.

- [ ] **Step 2: Add the sender**

```ts
// src/lib/resend.ts — appended, keeping the existing sender untouched
import { PasswordResetEmail } from '@/emails/password-reset';
import { RESET_TOKEN_TTL_MINUTES } from '@/features/auth/utils/reset-token';

type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
) {
  if (!env.RESEND_FROM_EMAIL) {
    // Configuration error, not a user error — surfacing it beats sending
    // password mail from a placeholder address.
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: params.to,
    subject: 'Reset your password',
    react: jsx(PasswordResetEmail, {
      name: params.name,
      resetUrl: params.resetUrl,
      // SVG is stripped by Gmail and Outlook; the PNG is the only safe choice.
      logoUrl: `${env.APP_URL}/logos/logo-black.png`,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      supportEmail: env.SUPPORT_EMAIL,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}
```

- [ ] **Step 3: Verify types and lint**

Run: `pnpm typecheck && pnpm lint:check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/env/server.ts src/lib/resend.ts
git commit -m "add password reset email sender"
```

---

### Task 7: Request-reset action

**Files:**
- Modify: `src/features/auth/actions/schema.ts`
- Create: `src/features/auth/actions/password-reset.ts`
- Test: `src/features/auth/actions/schema.test.ts` (extend)

**Interfaces:**
- Consumes: `generateResetToken`, `hashResetToken`, `resetTokenExpiry`, `RESET_TOKEN_REQUEST_LIMIT`, `RESET_TOKEN_REQUEST_WINDOW_MINUTES` (Task 2); `maskEmail` (Task 3); `passwordResetTokens` (Task 5); `sendPasswordResetEmail` (Task 6).
- Produces: `forgotPasswordSchema`, `ForgotPasswordFormValues`, and `requestPasswordResetAction(values: unknown): Promise<ApiSuccessWithoutData | ApiFailureWithoutData>`. Task 8 consumes them.

- [ ] **Step 1: Write the failing schema test**

Append to `src/features/auth/actions/schema.test.ts`:

```ts
import { forgotPasswordSchema } from '@/features/auth/actions/schema';

describe('forgotPasswordSchema', () => {
  it('accepts an email address', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: 'jsmith@panesar.co.ke' })
        .identifier
    ).toBe('jsmith@panesar.co.ke');
  });

  it('accepts a contact number', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: '0712345678' }).identifier
    ).toBe('0712345678');
  });

  it('lowercases and trims so lookup is case-insensitive', () => {
    expect(
      forgotPasswordSchema.parse({ identifier: '  JSmith@Panesar.co.ke ' })
        .identifier
    ).toBe('jsmith@panesar.co.ke');
  });

  it('rejects an empty identifier', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '' }).success).toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: FAIL — `forgotPasswordSchema` is not exported.

- [ ] **Step 3: Add the schema**

```ts
// src/features/auth/actions/schema.ts — appended
export const forgotPasswordSchema = z.object({
  identifier: requiredStringSchemaEntry('Email or contact is required'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Write the action**

```ts
// src/features/auth/actions/password-reset.ts
'use server';

import { and, eq, gte, isNull } from 'drizzle-orm';

import type {
  ApiFailureWithoutData,
  ApiSuccessWithoutData,
} from '@/types/index.types';

import db from '@/drizzle/db';
import { passwordResetTokens } from '@/drizzle/schema';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/actions/schema';
import { maskEmail } from '@/features/auth/utils/mask-email';
import {
  RESET_TOKEN_REQUEST_LIMIT,
  generateResetToken,
  hashResetToken,
  resetRequestWindowStart,
  resetTokenExpiry,
} from '@/features/auth/utils/reset-token';
import { env } from '@/env/server';
import { validateFields } from '@/lib/action-validator';
import { sendPasswordResetEmail } from '@/lib/resend';

export async function requestPasswordResetAction(
  values: unknown
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> {
  const { data, error } = validateFields<ForgotPasswordFormValues>(
    values,
    forgotPasswordSchema
  );

  if (error !== null) {
    return { error: true, message: 'Enter your email address or contact.' };
  }

  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, active: true },
    where: (users, { eq, or }) =>
      or(eq(users.email, data.identifier), eq(users.contact, data.identifier)),
  });

  if (!user) {
    return { error: true, message: 'No account found for that email or contact.' };
  }

  if (!user.active) {
    return { error: true, message: 'That account is deactivated. Contact IT.' };
  }

  if (!user.email) {
    return {
      error: true,
      message: 'No email address on file for that account. Contact IT.',
    };
  }

  const now = new Date();
  const windowStart = resetRequestWindowStart(now);

  const recent = await db.query.passwordResetTokens.findMany({
    columns: { id: true },
    where: and(
      eq(passwordResetTokens.userId, user.id),
      gte(passwordResetTokens.createdAt, windowStart)
    ),
  });

  if (recent.length >= RESET_TOKEN_REQUEST_LIMIT) {
    return {
      error: true,
      message: 'Too many reset requests. Try again in an hour.',
    };
  }

  const token = generateResetToken();

  // Supersede any outstanding link so only the newest one works.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  const [{ id: tokenId }] = await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: resetTokenExpiry(now),
    })
    .returning({ id: passwordResetTokens.id });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name.split(' ')[0],
      resetUrl: `${env.APP_URL}/reset-password/${token}`,
    });
  } catch (sendError) {
    console.error('Failed to send password reset email:', sendError);
    // Roll the token back so a failed send does not burn a throttle slot.
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, tokenId));

    return {
      error: true,
      message: 'Could not send the reset email. Try again shortly.',
    };
  }

  return {
    error: false,
    message: `Reset link sent to ${maskEmail(user.email)}`,
  };
}
```

- [ ] **Step 6: Verify types, lint, and the full suite**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/actions/
git commit -m "add password reset request action"
```

---

### Task 8: Forgot-password page and the broken link

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/features/auth/components/forgot-password-form.tsx`
- Modify: `src/features/auth/components/login-form.tsx:71`

**Interfaces:**
- Consumes: `requestPasswordResetAction`, `forgotPasswordSchema`, `ForgotPasswordFormValues` (Task 7).
- Produces: the `/forgot-password` route.

- [ ] **Step 1: Build the form**

```tsx
// src/features/auth/components/forgot-password-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CustomAlert } from '@/components/custom/custom-alert';
import { ButtonLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { requestPasswordResetAction } from '@/features/auth/actions/password-reset';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/actions/schema';
import { useError } from '@/hooks/use-error';

export function ForgotPasswordForm() {
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const { clearErrors, errors, onError } = useError();

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { identifier: '' },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordFormValues) {
    clearErrors();
    setSentMessage(null);

    const result = await requestPasswordResetAction(data);

    if (result.error) {
      onError(result.message);
      return;
    }

    setSentMessage(result.message);
    form.reset();
  }

  if (sentMessage) {
    return (
      <div className="space-y-4">
        <CustomAlert variant="success" description={sentMessage} />
        <p className="text-sm text-muted-foreground">
          The link expires in 30 minutes and can only be used once. Check your
          spam folder if it does not arrive.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login" prefetch={false}>
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors && <CustomAlert variant="error" description={errors} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact/Email</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    placeholder="jsmith@example.com"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <ButtonLoader loadingText="Sending..." />
            ) : (
              <>
                <MailIcon />
                <span>Send reset link</span>
              </>
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login" prefetch={false}>
              Back to sign in
            </Link>
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

`CustomAlert` takes a required `variant` of `ColorVariant` — `'info' | 'success' | 'warning' | 'error'` — so `"success"` and `"error"` above are both valid.

- [ ] **Step 2: Build the page**

```tsx
// src/app/(auth)/forgot-password/page.tsx
import type { Metadata } from 'next';

import Image from 'next/image';

import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          alt="Panesars Kenya Ltd logo"
          src="/logos/logo-light.svg"
          height={360}
          width={600}
          className="w-[148px] h-auto mx-auto"
          priority
        />
      </div>
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-0.5 mt-2 mb-6">
          <h2 className="text-center text-2xl/9 tracking-tight font-display">
            Forgot your password?
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email or contact and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Fix the broken link**

In `src/features/auth/components/login-form.tsx`, line 71, change `href="/login"` to `href="/forgot-password"`. Leave `prefetch={false}` and the classes alone.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint:check`
Expected: PASS. Typed routes will fail the build if `/forgot-password` does not resolve, which confirms the page is wired up.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/forgot-password src/features/auth/components/
git commit -m "add forgot password page"
```

---

### Task 9: Reset-password action

**Files:**
- Modify: `src/features/auth/actions/schema.ts`
- Modify: `src/features/auth/actions/password-reset.ts`
- Test: `src/features/auth/actions/schema.test.ts` (extend)

**Interfaces:**
- Consumes: `hashResetToken`, `resetTokenState` (Task 2); `passwordResetTokens` (Task 5); `hashPassword` from `@/features/admin/utils/helpers`.
- Produces: `resetPasswordSchema`, `ResetPasswordFormValues`, `findValidResetToken(token: string): Promise<{ id: string; userId: string } | null>`, and `resetPasswordAction(values: unknown): Promise<ApiSuccessWithoutData | ApiFailureWithoutData>`. Task 10 consumes all four.

- [ ] **Step 1: Write the failing schema test**

Append to `src/features/auth/actions/schema.test.ts`:

```ts
import { resetPasswordSchema } from '@/features/auth/actions/schema';

describe('resetPasswordSchema', () => {
  const valid = {
    token: 'a-token',
    newPassword: 'NewPass456',
    confirmPassword: 'NewPass456',
  };

  it('accepts a matching pair and preserves case', () => {
    const parsed = resetPasswordSchema.parse(valid);

    expect(parsed.newPassword).toBe('NewPass456');
  });

  it('rejects a mismatched confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1',
    });

    expect(result.success).toBe(false);
  });

  it('puts the mismatch error on the confirmation field', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'a-token',
      newPassword: 'Short1',
      confirmPassword: 'Short1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing token', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, token: '' });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: FAIL — `resetPasswordSchema` is not exported.

- [ ] **Step 3: Add the schema**

The 8-character minimum here is phase 1's floor; Task 12 raises it to the full policy.

```ts
// src/features/auth/actions/schema.ts — appended
export const resetPasswordSchema = z
  .object({
    token: requiredTrimmedStringSchemaEntry('Reset token is missing'),
    newPassword: requiredTrimmedStringSchemaEntry(
      'New password is required'
    ).min(8, 'Password must be at least 8 characters long'),
    confirmPassword: requiredTrimmedStringSchemaEntry(
      'Password confirmation is required'
    ),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/actions/schema.test.ts`
Expected: PASS — 14 tests.

- [ ] **Step 5: Add the lookup helper and the action**

`findValidResetToken` is the single gate used by both the page render and the action, so the two cannot drift.

```ts
// src/features/auth/actions/password-reset.ts — appended
import { sessions, users } from '@/drizzle/schema';
import {
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from '@/features/auth/actions/schema';
import { resetTokenState } from '@/features/auth/utils/reset-token';
import { hashPassword } from '@/features/admin/utils/helpers';

export async function findValidResetToken(token: string) {
  const row = await db.query.passwordResetTokens.findFirst({
    columns: { id: true, userId: true, expiresAt: true, usedAt: true },
    where: (table, { eq }) => eq(table.tokenHash, hashResetToken(token)),
  });

  if (!row) {
    return null;
  }

  if (resetTokenState(row, new Date()) !== 'valid') {
    return null;
  }

  return { id: row.id, userId: row.userId };
}

export async function resetPasswordAction(
  values: unknown
): Promise<ApiSuccessWithoutData | ApiFailureWithoutData> {
  const { data, error } = validateFields<ResetPasswordFormValues>(
    values,
    resetPasswordSchema
  );

  if (error !== null) {
    return { error: true, message: 'Check the passwords you entered.' };
  }

  // Re-validated here: the page render is not a trusted gate.
  const valid = await findValidResetToken(data.token);

  if (!valid) {
    return {
      error: true,
      message: 'That reset link is invalid or has expired. Request a new one.',
    };
  }

  const hashedPassword = await hashPassword(data.newPassword);
  const now = new Date();

  await db.transaction(async tx => {
    await tx
      .update(users)
      .set({ password: hashedPassword, promptPasswordChange: false })
      .where(eq(users.id, valid.userId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, valid.userId),
          isNull(passwordResetTokens.usedAt)
        )
      );

    // A reset signs out every existing session, so a stolen cookie dies here.
    await tx.delete(sessions).where(eq(sessions.userId, valid.userId));
  });

  return {
    error: false,
    message: 'Password updated. Sign in with your new password.',
  };
}
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/actions/
git commit -m "add password reset completion action"
```

---

### Task 10: Reset-password page and form

**Files:**
- Create: `src/app/(auth)/reset-password/[token]/page.tsx`
- Create: `src/features/auth/components/reset-password-form.tsx`

**Interfaces:**
- Consumes: `findValidResetToken`, `resetPasswordAction`, `resetPasswordSchema`, `ResetPasswordFormValues` (Task 9).
- Produces: the `/reset-password/[token]` route.

Note: in Next.js 16, `params` is a Promise and must be awaited.

- [ ] **Step 1: Build the form**

```tsx
// src/features/auth/components/reset-password-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { CustomAlert } from '@/components/custom/custom-alert';
import { ButtonLoader } from '@/components/custom/loaders';
import { PasswordInput } from '@/components/custom/password-input';
import { notify } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { resetPasswordAction } from '@/features/auth/actions/password-reset';
import {
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from '@/features/auth/actions/schema';
import { useError } from '@/hooks/use-error';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { clearErrors, errors, onError } = useError();

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { token, newPassword: '', confirmPassword: '' },
    resolver: zodResolver(resetPasswordSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: ResetPasswordFormValues) {
    clearErrors();

    const result = await resetPasswordAction(data);

    if (result.error) {
      onError(result.message);
      return;
    }

    notify.success('Success', result.message);
    router.push('/login');
  }

  return (
    <div className="space-y-4">
      {errors && <CustomAlert variant="error" description={errors} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    placeholder="Enter your new password"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    placeholder="Confirm your new password"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <ButtonLoader loadingText="Updating..." />
            ) : (
              <>
                <LockIcon className="size-4" />
                <span>Set new password</span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

- [ ] **Step 2: Build the page**

```tsx
// src/app/(auth)/reset-password/[token]/page.tsx
import type { Metadata } from 'next';

import Image from 'next/image';
import Link from 'next/link';

import { CustomAlert } from '@/components/custom/custom-alert';
import { Button } from '@/components/ui/button';
import { findValidResetToken } from '@/features/auth/actions/password-reset';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Choose a new password',
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await findValidResetToken(token);

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          alt="Panesars Kenya Ltd logo"
          src="/logos/logo-light.svg"
          height={360}
          width={600}
          className="w-[148px] h-auto mx-auto"
          priority
        />
      </div>
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {valid ? (
          <>
            <div className="space-y-0.5 mt-2 mb-6">
              <h2 className="text-center text-2xl/9 tracking-tight font-display">
                Choose a new password
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                Signing in elsewhere will end when you set this password.
              </p>
            </div>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <div className="space-y-4">
            <CustomAlert
              variant="error"
              description="That reset link is invalid or has expired. Reset links last 30 minutes and can only be used once."
            />
            <Button asChild className="w-full">
              <Link href="/forgot-password" prefetch={false}>
                Request a new link
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm lint:check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/reset-password src/features/auth/components/reset-password-form.tsx
git commit -m "add reset password page"
```

---

### Task 11: Public-route prefix matching

`src/proxy.ts` gates public routes with `publicRoutes.includes(path)`, an exact match. `/reset-password/<token>` fails that test and is redirected to `/login`, so the link in the email would never open.

**Files:**
- Modify: `src/proxy.ts:9,66`
- Test: `src/proxy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `/reset-password/*` treated as public.

- [ ] **Step 1: Write the failing test**

Append to `src/proxy.test.ts`, inside the existing `describe` block, matching the mock setup already at the top of that file:

```ts
  test('treats a reset-password token URL as public', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    nextMock.mockReturnValue('next');

    const result = await proxy(
      createRequest('/reset-password/AbC123-xyz') as never
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');
  });

  test('still redirects an unauthenticated protected route', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(createRequest('/dashboard') as never);

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });

  test('does not treat a lookalike prefix as public', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(
      createRequest('/reset-password-admin') as never
    );

    expect(redirectMock).toHaveBeenCalled();
    expect(result).toBe('redirect');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/proxy.test.ts`
Expected: FAIL — the first test redirects instead of continuing.

- [ ] **Step 3: Implement prefix matching**

```ts
// src/proxy.ts:9
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/inngest',
];
```

```ts
// src/proxy.ts — replacing `const isPublicRoute = publicRoutes.includes(path);`
  // Prefix match, so /reset-password/<token> is public while
  // /reset-password-admin is not.
  const isPublicRoute = publicRoutes.some(
    route => path === route || path.startsWith(`${route}/`)
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/proxy.test.ts`
Expected: PASS — including the pre-existing tests.

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/proxy.test.ts
git commit -m "match public routes by prefix"
```

---

### Task 12: Phase 1 manual verification

No code. Phase 1 is shippable at the end of this task.

**Files:** none.

- [ ] **Step 1: Apply the migration against a development database**

Run: `pnpm db:migrate`
Expected: the `password_reset_tokens` migration applies cleanly.

- [ ] **Step 2: Set the new environment variables**

Add `APP_URL=http://localhost:3000` to `.env`. Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set, since the request action now fails loudly without a sender.

- [ ] **Step 3: Walk the flow**

Run: `pnpm dev`, then:
- `/login` — the "Forgot Password?" link goes to `/forgot-password`, not back to `/login`.
- Submit an unknown identifier → `No account found for that email or contact.`
- Submit a real user's contact → masked success message; the email arrives with the logo in the header, a working button, and a 30-minute expiry.
- Open the link → the set-password form renders.
- Set a new password → redirected to `/login`; the old session is gone; the new password works, with its case preserved.
- Open the same link again → invalid-link state, not the form.
- Request four resets in an hour → the fourth returns `Too many reset requests. Try again in an hour.`

- [ ] **Step 4: Confirm the casing fix on a legacy account**

Log in as a user whose password was set before this change, using their original casing. It should succeed, and the stored hash should change. Query afterwards to confirm:

```sql
select password from users where id = '<user-id>';
```

- [ ] **Step 5: Commit any fixes found**

```bash
git commit -am "fix issues found in phase 1 verification"
```

---

# Phase 2 — Password policy

Phase 2 assumes phase 1 is merged. It is separately reviewable.

### Task 13: Policy predicate and strength scoring

**Files:**
- Create: `src/features/auth/utils/password-policy.ts`
- Test: `src/features/auth/utils/password-policy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `CURRENT_POLICY_VERSION` (1), `MIN_PASSWORD_LENGTH` (12), `PolicyUser`, `PolicyFailure`, `checkPasswordPolicy(password: string, user: PolicyUser): PolicyFailure[]`, `policyFailureMessage(failure: PolicyFailure): string`, `isPolicyCompliant(version: number | null): boolean`, `passwordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong'`, `shouldGate(input: { compliant: boolean; deadline: Date | null; exemptUntil: Date | null; now: Date }): boolean`. Tasks 14 through 19 consume these.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/auth/utils/password-policy.test.ts
import { describe, expect, it } from 'vitest';

import {
  CURRENT_POLICY_VERSION,
  checkPasswordPolicy,
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
    expect(checkPasswordPolicy('abcdefghijkl', user)).toEqual([]);
  });

  it('rejects a password containing the surname', () => {
    expect(checkPasswordPolicy('smithsmithsmith', user)).toContain(
      'contains-personal-data'
    );
  });

  it('rejects a password containing the email local part', () => {
    expect(checkPasswordPolicy('jsmith-is-great', user)).toContain(
      'contains-personal-data'
    );
  });

  it('rejects a password containing the contact number', () => {
    expect(checkPasswordPolicy('my0712345678pass', user)).toContain(
      'contains-personal-data'
    );
  });

  it('is case-insensitive about personal data', () => {
    expect(checkPasswordPolicy('JSMITHisgreat', user)).toContain(
      'contains-personal-data'
    );
  });

  it('rejects blocklisted words regardless of case', () => {
    expect(checkPasswordPolicy('PanesarPanesar', user)).toContain(
      'blocklisted'
    );
    expect(checkPasswordPolicy('passwordpassword', user)).toContain(
      'blocklisted'
    );
  });

  it('rejects a single repeated character', () => {
    expect(checkPasswordPolicy('aaaaaaaaaaaaaa', user)).toContain(
      'blocklisted'
    );
  });

  it('rejects keyboard and alphabet runs', () => {
    expect(checkPasswordPolicy('qwertyuiopasdf', user)).toContain(
      'blocklisted'
    );
    expect(checkPasswordPolicy('abcdefghijklmn', user)).toContain(
      'blocklisted'
    );
  });

  it('does not require any character classes', () => {
    // Deliberately all-lowercase, no digits, no symbols.
    expect(checkPasswordPolicy('correcthorsebatterystaple', user)).toEqual([]);
  });

  it('tolerates a null email', () => {
    expect(
      checkPasswordPolicy('marble-tractor-window', { ...user, email: null })
    ).toEqual([]);
  });

  it('reports every failure at once', () => {
    expect(checkPasswordPolicy('smith', user).sort()).toEqual(
      ['contains-personal-data', 'too-short'].sort()
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
      shouldGate({ compliant: true, deadline: past, exemptUntil: null, now })
    ).toBe(false);
  });

  it('never gates when no deadline is configured', () => {
    expect(
      shouldGate({ compliant: false, deadline: null, exemptUntil: null, now })
    ).toBe(false);
  });

  it('does not gate before the deadline', () => {
    expect(
      shouldGate({ compliant: false, deadline: future, exemptUntil: null, now })
    ).toBe(false);
  });

  it('gates a non-compliant user after the deadline', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: null, now })
    ).toBe(true);
  });

  it('honours an unexpired exemption', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: future, now })
    ).toBe(false);
  });

  it('ignores an expired exemption', () => {
    expect(
      shouldGate({ compliant: false, deadline: past, exemptUntil: past, now })
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/utils/password-policy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/auth/utils/password-policy.ts
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
    .map(fragment => fragment.trim().toLowerCase())
    .filter(fragment => fragment.length >= 4);
}

function containsRun(lowered: string) {
  return RUNS.some(run => {
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
  user: PolicyUser
): PolicyFailure[] {
  const failures: PolicyFailure[] = [];
  const lowered = password.toLowerCase();

  if (password.length < MIN_PASSWORD_LENGTH) {
    failures.push('too-short');
  }

  if (personalFragments(user).some(fragment => lowered.includes(fragment))) {
    failures.push('contains-personal-data');
  }

  const isRepeatedCharacter = password.length > 0 && new Set(lowered).size === 1;

  if (
    BLOCKLIST.some(word => lowered.includes(word)) ||
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
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(pattern =>
    pattern.test(password)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/utils/password-policy.test.ts`
Expected: PASS — 26 tests. If `passwordStrength` boundaries do not line up with the three expectations, adjust the thresholds in the implementation until they do; the exact curve is a judgement call, the tested outcomes are not.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/utils/password-policy.ts src/features/auth/utils/password-policy.test.ts
git commit -m "add password policy predicate"
```

---

### Task 14: Policy columns migration

**Files:**
- Modify: `src/drizzle/migrations/schema.ts` (the `users` table)
- Modify: `src/features/admin/services/action.ts:194`
- Modify: `src/features/change-password/services/action.ts:80`
- Modify: `src/features/admin/services/data.ts:33,56`

**Interfaces:**
- Consumes: nothing.
- Produces: `users.passwordPolicyVersion`, `users.passwordChangedAt`, `users.passwordPolicyExemptUntil`. `users.promptPasswordChange` no longer exists.

- [ ] **Step 1: Add the columns**

In the `users` table in `src/drizzle/migrations/schema.ts`, remove the `promptPasswordChange` line and add:

```ts
    passwordPolicyVersion: smallint('password_policy_version')
      .default(0)
      .notNull(),
    passwordChangedAt: timestamp('password_changed_at', {
      withTimezone: true,
    }),
    passwordPolicyExemptUntil: timestamp('password_policy_exempt_until', {
      withTimezone: true,
    }),
```

Add `smallint` to the `drizzle-orm/pg-core` import list at the top of that file if it is not already there.

- [ ] **Step 2: Remove every reference to the dead flag**

- `src/features/admin/services/action.ts:194` — delete `promptPasswordChange: true,` from the insert values.
- `src/features/change-password/services/action.ts:80` — delete `promptPasswordChange: false,` from the update set.
- `src/features/admin/services/data.ts:33,56` — delete `promptPasswordChange: false,` from both column selections.
- `src/features/auth/actions/password-reset.ts` — delete `promptPasswordChange: false,` from the reset transaction added in Task 9.

- [ ] **Step 3: Generate and review the migration**

Run: `pnpm db:generate`
Then: `cat src/drizzle/migrations/00XX_*.sql` (the newest file)

Expected: three `ADD COLUMN` statements and `DROP COLUMN "prompt_password_change"`, and nothing else.

- [ ] **Step 4: Verify types**

Run: `pnpm typecheck`
Expected: PASS. Any failure names a file still referencing `promptPasswordChange`.

- [ ] **Step 5: Commit**

```bash
git add src/drizzle/ src/features/
git commit -m "add password policy columns"
```

---

### Task 15: Enforce the policy on every password write

**Files:**
- Modify: `src/features/auth/actions/schema.ts`
- Modify: `src/features/auth/actions/password-reset.ts`
- Modify: `src/features/change-password/utils/schema.ts`
- Modify: `src/features/change-password/services/action.ts`
- Modify: `src/features/admin/utils/helpers.ts`

**Interfaces:**
- Consumes: `checkPasswordPolicy`, `policyFailureMessage`, `CURRENT_POLICY_VERSION`, `MIN_PASSWORD_LENGTH` (Task 13); the new columns (Task 14).
- Produces: every password write stamps `passwordPolicyVersion` and `passwordChangedAt`.

The policy needs the user's name, email and contact, which the schema does not have — so the length floor moves to `MIN_PASSWORD_LENGTH` in the zod schemas, and the personal-data and blocklist checks run inside the actions where the user record is loaded.

- [ ] **Step 1: Raise the length floor in both schemas**

In `src/features/auth/actions/schema.ts`, change `resetPasswordSchema`'s `.min(8, ...)` to:

```ts
    ).min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    ),
```

Import `MIN_PASSWORD_LENGTH` from `@/features/auth/utils/password-policy`. Make the same change to `newPassword` in `src/features/change-password/utils/schema.ts`.

The existing `rejects a password shorter than 8 characters` test in `src/features/auth/actions/schema.test.ts` still passes — its fixture `'Short1'` is 6 characters, short under either rule — but it is now misnamed and no longer tests the boundary. Rename it to `rejects a password shorter than 12 characters` and change both password fields in its fixture to `'ElevenChar1'` (11 characters), so it fails if the floor is ever lowered.

- [ ] **Step 2: Enforce the full policy in the reset action**

In `resetPasswordAction`, after `findValidResetToken` succeeds, load the user and check:

```ts
  const user = await db.query.users.findFirst({
    columns: { name: true, email: true, contact: true },
    where: (table, { eq }) => eq(table.id, valid.userId),
  });

  if (!user) {
    return { error: true, message: 'That account no longer exists.' };
  }

  const failures = checkPasswordPolicy(data.newPassword, user);

  if (failures.length > 0) {
    return { error: true, message: policyFailureMessage(failures[0]) };
  }
```

Then extend the `users` update inside the transaction:

```ts
      .set({
        password: hashedPassword,
        passwordPolicyVersion: CURRENT_POLICY_VERSION,
        passwordChangedAt: now,
      })
```

- [ ] **Step 3: Enforce the same policy in the change-password action**

In `src/features/change-password/services/action.ts`, extend the existing user lookup to select `name`, `email` and `contact` alongside `id` and `password`, run the same `checkPasswordPolicy` block after the current-password check, and extend the update:

```ts
      .set({
        password: hashedNewPassword,
        passwordPolicyVersion: CURRENT_POLICY_VERSION,
        passwordChangedAt: new Date(),
      })
```

- [ ] **Step 4: Make generated passwords crypto-grade and policy-satisfying**

```ts
// src/features/admin/utils/helpers.ts
import { randomInt } from 'node:crypto';

import { MIN_PASSWORD_LENGTH } from '@/features/auth/utils/password-policy';

export const generatePassword = (length: number = MIN_PASSWORD_LENGTH) => {
  const characters =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
  let password = '';
  for (let i = 0; i < Math.max(length, MIN_PASSWORD_LENGTH); i++) {
    password += characters[randomInt(characters.length)];
  }
  return password;
};
```

Change the two `generatePassword(8)` calls in `src/features/admin/services/action.ts` to `generatePassword()`. A generated temporary password is deliberately **not** stamped as compliant: it travels over SMS in plaintext, so the recipient must still set their own, and leaving `passwordPolicyVersion` at 0 routes them through the banner and gate.

- [ ] **Step 5: Verify**

Run: `pnpm test && pnpm typecheck && pnpm lint:check`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/
git commit -m "enforce password policy on every password write"
```

---

### Task 16: Silent stamping at login

**Files:**
- Modify: `src/features/auth/actions/auth.ts`

**Interfaces:**
- Consumes: `checkPasswordPolicy`, `CURRENT_POLICY_VERSION`, `isPolicyCompliant` (Task 13); `verifyPassword` (Task 1).
- Produces: `loginAction` stamps compliant users and returns the compliance state to `createSession` in Task 17.

A bcrypt hash cannot be inspected, so compliance cannot be judged at rest. Login holds the plaintext for a moment after a successful compare — checking there is what keeps the forced-change population small.

- [ ] **Step 1: Extend the user lookup**

The `db.query.users.findFirst` call in `loginAction` currently selects every column. Confirm it returns `name`, `email`, `contact` and `passwordPolicyVersion`; if it has an explicit `columns` block, add them.

- [ ] **Step 2: Stamp after a successful verification**

Insert after the `verification.needsRehash` block and before `createSession`:

```ts
  let compliant = isPolicyCompliant(user.passwordPolicyVersion);

  // The plaintext is only available here, so this is the one place an existing
  // password can be judged against the policy without forcing a change.
  if (!compliant && checkPasswordPolicy(data.password, user).length === 0) {
    await db
      .update(users)
      .set({ passwordPolicyVersion: CURRENT_POLICY_VERSION })
      .where(eq(users.id, user.id));

    compliant = true;
  }
```

The re-hash branch above must **not** stamp: it re-stores a legacy password that has not been checked against the policy. The two branches are independent — a legacy password can be re-hashed and still fail the policy.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass. `compliant` is unused until Task 17; if lint objects, complete Task 17 in the same commit.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/actions/auth.ts
git commit -m "stamp policy compliance at login"
```

---

### Task 17: Carry compliance in the session

**Files:**
- Modify: `src/types/index.types.ts:18-22`
- Modify: `src/lib/session.ts`
- Modify: `src/features/auth/actions/auth.ts`

**Interfaces:**
- Consumes: `compliant` from Task 16.
- Produces: `SessionPayload.policyCompliant?: boolean`; `createSession(userId: string, options?: { policyCompliant?: boolean })`. Task 18 reads the claim.

- [ ] **Step 1: Add the claim to the payload type**

```ts
// src/types/index.types.ts
export interface SessionPayload extends JWTPayload {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  // Absent on sessions issued before the policy shipped; treated as compliant
  // so nobody is gated on a stale cookie, and refreshed at next login.
  policyCompliant?: boolean;
}
```

- [ ] **Step 2: Accept and forward it in `createSession`**

```ts
// src/lib/session.ts
export async function createSession(
  userId: string,
  options?: { policyCompliant?: boolean }
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const createdSession = await db
    .insert(sessions)
    .values({ expiresAt: expiresAt.toISOString(), userId })
    .returning({ id: sessions.id });

  const session = await encrypt({
    userId,
    sessionId: createdSession[0].id,
    expiresAt,
    policyCompliant: options?.policyCompliant,
  });
```

The rest of the function is unchanged. The parameter is optional, so existing callers keep compiling.

- [ ] **Step 3: Pass it from login**

In `loginAction`, change `await createSession(user.id);` to:

```ts
  await createSession(user.id, { policyCompliant: compliant });
```

- [ ] **Step 4: Re-issue the session when the password changes**

In `src/features/change-password/services/action.ts`, after the successful update, call `await createSession(currentUser.id, { policyCompliant: true })` so the gate lifts immediately rather than at next login. Import `createSession` alongside the existing `getCurrentUser` import.

- [ ] **Step 5: Verify**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.types.ts src/lib/session.ts src/features/
git commit -m "carry policy compliance in the session"
```

---

### Task 18: The policy gate

**Files:**
- Modify: `src/env/server.ts`
- Modify: `src/proxy.ts`
- Test: `src/proxy.test.ts`

**Interfaces:**
- Consumes: `shouldGate` (Task 13); `SessionPayload.policyCompliant` (Task 17).
- Produces: non-compliant users redirected to `/change-password` after the deadline.

The gate lives here rather than in `(protected)/layout.tsx` because `/change-password` sits inside that layout and App Router server layouts cannot read the pathname — a layout gate would redirect that page to itself.

- [ ] **Step 1: Add the deadline variable**

```ts
// src/env/server.ts
    PASSWORD_POLICY_DEADLINE: z.string().datetime().optional(),
```

While unset, the system stamps and nags but never gates. This is the kill switch: clearing the variable lifts the gate with no deploy.

- [ ] **Step 2: Write the failing test**

Append to `src/proxy.test.ts`. The first test is the one that must fail before
the gate exists — the others pin down behaviour that must *not* change.

```ts
  test('redirects a non-compliant user to change-password after the deadline', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({ isDenied: () => false });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    redirectMock.mockReturnValue('redirect');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(redirectMock).toHaveBeenCalled();
    expect(String(redirectMock.mock.calls[0][0])).toContain('/change-password');
    expect(result).toBe('redirect');

    vi.unstubAllEnvs();
  });

  test('never gates the change-password page itself', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({ isDenied: () => false });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(
      createRequest('/change-password', 'cookie') as never
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });

  test('does not gate a compliant user after the deadline', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({ isDenied: () => false });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: true,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });

  test('does not gate a non-compliant user when no deadline is set', async () => {
    protectMock.mockResolvedValue({ isDenied: () => false });
    decryptMock.mockResolvedValue({
      userId: 'u1',
      sessionId: 's1',
      policyCompliant: false,
    });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe('next');
  });

  test('lets a session issued before the policy through', async () => {
    vi.stubEnv('PASSWORD_POLICY_DEADLINE', '2026-01-01T00:00:00.000Z');
    protectMock.mockResolvedValue({ isDenied: () => false });
    // No policyCompliant claim at all.
    decryptMock.mockResolvedValue({ userId: 'u1', sessionId: 's1' });
    nextMock.mockReturnValue('next');

    const result = await proxy(createRequest('/dashboard', 'cookie') as never);

    expect(result).toBe('next');

    vi.unstubAllEnvs();
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/proxy.test.ts`
Expected: FAIL on `redirects a non-compliant user to change-password after the deadline` — no gate exists yet, so the request falls through to `NextResponse.next()`. The other four tests pass already; they are regression guards.

- [ ] **Step 4: Implement the gate**

Insert in `proxy`, after the existing `if (!isPublicRoute && !hasSession)` redirect and before the final `NextResponse.next()`:

```ts
  const deadline = process.env.PASSWORD_POLICY_DEADLINE
    ? new Date(process.env.PASSWORD_POLICY_DEADLINE)
    : null;

  // `/change-password` must stay reachable or the gate redirects to itself.
  const isPolicyExempt =
    path === '/change-password' || path.startsWith('/api/');

  if (
    hasSession &&
    !isPolicyExempt &&
    shouldGate({
      // A session predating the policy has no claim; treat it as compliant and
      // let the next login settle it, rather than gating on stale data.
      compliant: session?.policyCompliant !== false,
      deadline,
      // Per-user exemptions are not in the JWT; they take effect at next login.
      exemptUntil: null,
      now: new Date(),
    })
  ) {
    return NextResponse.redirect(new URL('/change-password', req.nextUrl));
  }
```

Import `shouldGate` from `@/features/auth/utils/password-policy`. Note the per-user exemption is applied at login time (Task 19) rather than in the proxy, which has no database access.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/proxy.test.ts`
Expected: PASS — all tests, old and new.

- [ ] **Step 6: Commit**

```bash
git add src/proxy.ts src/proxy.test.ts src/env/server.ts
git commit -m "gate non-compliant users after the policy deadline"
```

---

### Task 19: Per-user exemption at login

**Files:**
- Modify: `src/features/auth/actions/auth.ts`
- Modify: `src/features/admin/services/action.ts`

**Interfaces:**
- Consumes: `shouldGate` (Task 13); `passwordPolicyExemptUntil` (Task 14).
- Produces: `grantPolicyExemption(userId: string, until: Date)` in the admin service; exempt users receive `policyCompliant: true` in their session.

Because the proxy has no database access, an exemption is resolved once at login and carried in the claim.

- [ ] **Step 1: Apply the exemption when issuing the session**

In `loginAction`, replace the `createSession` call from Task 17 with:

```ts
  const exemptUntil = user.passwordPolicyExemptUntil
    ? new Date(user.passwordPolicyExemptUntil)
    : null;

  const exempt =
    exemptUntil !== null && Date.now() < exemptUntil.getTime();

  await createSession(user.id, { policyCompliant: compliant || exempt });
```

- [ ] **Step 2: Add the admin action**

```ts
// src/features/admin/services/action.ts — appended
export const grantPolicyExemption = async (userId: string, until: Date) => {
  await requirePermission('admin:admin');

  await db
    .update(users)
    .set({ passwordPolicyExemptUntil: until })
    .where(eq(users.id, userId));

  revalidateUserTags(userId);
};
```

- [ ] **Step 3: Surface it in the admin UI**

Mirror the existing reset-password dialog at `src/features/admin/components/users/reset-password-form.tsx`: add a sibling component offering a date input and calling `grantPolicyExemption`, wired into the same user row actions. Follow that file's structure exactly rather than inventing a new pattern.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/
git commit -m "add per-user policy exemption"
```

---

### Task 20: Strength meter and banner

**Files:**
- Create: `src/components/custom/password-strength.tsx`
- Create: `src/components/auth/password-policy-banner.tsx`
- Modify: `src/features/change-password/components/change-password-form.tsx`
- Modify: `src/features/auth/components/reset-password-form.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `passwordStrength`, `MIN_PASSWORD_LENGTH`, `isPolicyCompliant` (Task 13); `getCurrentUser` from `@/lib/session`.
- Produces: `<PasswordStrength value={password} />` and `<PasswordPolicyBanner deadline={...} />`.

- [ ] **Step 1: Build the meter**

```tsx
// src/components/custom/password-strength.tsx
'use client';

import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
} from '@/features/auth/utils/password-policy';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const LEVELS = {
  weak: { value: 25, label: 'Weak', className: 'text-destructive' },
  fair: { value: 50, label: 'Fair', className: 'text-amber-600' },
  good: { value: 75, label: 'Good', className: 'text-blue-600' },
  strong: { value: 100, label: 'Strong', className: 'text-emerald-600' },
} as const;

export function PasswordStrength({ value }: { value: string }) {
  if (!value) {
    return null;
  }

  const level = LEVELS[passwordStrength(value)];

  return (
    <div className="space-y-1">
      <Progress value={level.value} className="h-1.5" />
      <p className={cn('text-xs', level.className)}>
        {level.label} — at least {MIN_PASSWORD_LENGTH} characters, and not your
        name, email or phone number.
      </p>
    </div>
  );
}
```

`src/components/ui/progress.tsx` already exists, backed by the installed `@radix-ui/react-progress`. No new dependency is needed — do not add one.

- [ ] **Step 2: Wire the meter into both password forms**

In `src/features/change-password/components/change-password-form.tsx` and `src/features/auth/components/reset-password-form.tsx`, watch the new-password field and render the meter under it:

```tsx
const newPassword = form.watch('newPassword');
// ...inside the newPassword FormItem, after <FormControl>:
<PasswordStrength value={newPassword} />
```

- [ ] **Step 3: Build the banner**

```tsx
// src/components/auth/password-policy-banner.tsx
import { CustomAlert } from '@/components/custom/custom-alert';

export function PasswordPolicyBanner({ deadline }: { deadline: Date | null }) {
  const days = deadline
    ? Math.max(
        0,
        Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      )
    : null;

  const description =
    days === null
      ? 'Your password does not meet the current policy. Update it from Change Password.'
      : `Your password does not meet the current policy. Update it within ${days} day${days === 1 ? '' : 's'} to avoid being locked out.`;

  return <CustomAlert variant="warning" description={description} />;
}
```

`CustomAlert`'s `warning` variant is the right one here; it is part of the `ColorVariant` union it already accepts.

- [ ] **Step 4: Render the banner for non-compliant users**

In `ProtectedLayoutContent` in `src/app/(protected)/layout.tsx`, `getCurrentUser()` is already awaited but its result is discarded. Capture it, and extend the `columns` block in `getCurrentUserOrNull` (`src/lib/session.ts`) to include `passwordPolicyVersion`. Then render above `{children}`:

```tsx
{!isPolicyCompliant(user.passwordPolicyVersion) && (
  <PasswordPolicyBanner
    deadline={
      process.env.PASSWORD_POLICY_DEADLINE
        ? new Date(process.env.PASSWORD_POLICY_DEADLINE)
        : null
    }
  />
)}
```

- [ ] **Step 5: Verify**

Run: `pnpm typecheck && pnpm lint:check && pnpm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/features/ src/app/ src/lib/session.ts
git commit -m "add password strength meter and policy banner"
```

---

### Task 21: Phase 2 manual verification

**Files:** none.

- [ ] **Step 1: Apply the migration**

Run: `pnpm db:migrate`

- [ ] **Step 2: Verify silent stamping**

Leave `PASSWORD_POLICY_DEADLINE` unset. Log in as a user whose password is long and unrelated to their details. They should see no banner, and:

```sql
select password_policy_version from users where id = '<user-id>';
```

should now read `1`. Log in as a user with a short password: version stays `0` and the banner appears.

- [ ] **Step 3: Verify the gate**

Set `PASSWORD_POLICY_DEADLINE` to a past ISO timestamp and restart. A non-compliant user should be redirected to `/change-password` from any page, and `/change-password` itself must still load — if it redirects to itself, the exemption in Task 18 is wrong. Change the password to a compliant one and confirm normal navigation resumes immediately without a re-login.

- [ ] **Step 4: Verify the escape hatch**

Clear `PASSWORD_POLICY_DEADLINE`, restart, and confirm the same user can navigate freely again.

- [ ] **Step 5: Check the compliance rate**

```sql
select count(*) from users where password_policy_version < 1 and active;
```

- [ ] **Step 6: Commit any fixes**

```bash
git commit -am "fix issues found in phase 2 verification"
```
