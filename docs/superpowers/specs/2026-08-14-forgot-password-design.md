# Forgot Password & Password Policy — Design

**Date:** 2026-08-14
**Branch:** `feat/forgot-password`
**Status:** Approved for planning

Delivered in two phases. **Phase 1** is the reset flow and the casing fix; it is
independently shippable and is the rescue path the rest depends on. **Phase 2**
adds the strong-password policy and its migration for existing accounts.

## Problem

The login form shows a "Forgot Password?" link, but it points at `/login`
(`src/features/auth/components/login-form.tsx:71`) and no reset flow exists. A
user who forgets their password must ask an administrator to reset it from the
admin console, which sends a new password over SMS.

## Decisions

| Question | Decision |
|---|---|
| Mechanism | Emailed single-use reset link; user chooses their own new password |
| Identifier accepted | Email **or** contact, mirroring the login form |
| Error messaging | Explicit (`No account found`, `Account is deactivated`) |
| SMS involvement | None |
| Token storage | New `password_reset_tokens` table; drop the dead `users.reset_token` column |
| Password casing | Fix case-preservation everywhere, with a self-healing login fallback |
| Policy tracking | `password_policy_version` column on `users`, not a membership table |
| Policy rule | Minimum 12 characters, personal-data and junk blocklist, no composition rules |
| Policy rollout | Silent stamping at login → countdown banner → hard gate at an env-var deadline |

Explicit error messages are acceptable here because this is an internal staff
ERP: the account list is the employee roster, so enumeration reveals nothing an
attacker could not get from a staff directory. Clear feedback when someone
mistypes their phone number is worth more than that.

## Architecture

### Routes

| Path | Kind | Responsibility |
|---|---|---|
| `/forgot-password` | Public page | Identifier form; triggers the reset email |
| `/reset-password/[token]` | Public page | Validates the token server-side, renders the set-password form |

Both live in the existing `(auth)` route group and reuse its centered layout.

### Server actions

Both in `src/features/auth/actions/`, following the existing
`validateFields` + `ApiSuccessWithoutData | ApiFailureWithoutData` convention:

- `requestPasswordResetAction(values)` — look up user, mint token, send email.
- `resetPasswordAction(values)` — validate token, set password, consume token.

### Route protection

`src/proxy.ts` gates public routes with `publicRoutes.includes(path)`, an exact
string match. `/reset-password/<token>` would fail that test and be redirected
to `/login`. The check becomes a prefix match:

```ts
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api/inngest'];
const isPublicRoute = publicRoutes.some(
  route => path === route || path.startsWith(`${route}/`)
);
```

The existing `isPublicRoute && hasSession` rule stands: a signed-in user who
opens a reset link lands on `/dashboard`. Signed-in users change their password
through `/change-password`.

## Data model

New table, defined in `src/drizzle/schemas/auth.ts` — a file that is currently
commented out in its entirety and becomes live with this feature:

```ts
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('password_reset_tokens_user_id_idx').on(table.userId)]);
```

Export it from `src/drizzle/schema.ts`. The generated migration also runs
`ALTER TABLE users DROP COLUMN reset_token` — the column is referenced only as
`resetToken: false` in two Drizzle column selections
(`src/features/admin/services/data.ts:34,57`), which are removed with it.

Only the SHA-256 hash of a token is stored. A leaked database backup therefore
yields no usable reset links.

## Flow

### Requesting a reset

1. User submits an identifier on `/forgot-password`.
2. Look up `email = identifier OR contact = identifier`, matching `loginAction`.
3. Reject with an explicit message when: no user matches, the account is
   inactive, or the matched user has no email on file (`users.email` is
   nullable in the schema, so this case is reachable regardless of current
   data).
4. Throttle: if the user already has 3 or more tokens created within the last
   hour, refuse with "Too many reset requests. Try again later."
5. Mint a token: `crypto.randomBytes(32)` encoded base64url. The existing
   `generatePassword` helper is **not** reused — it draws from `Math.random()`,
   which is not cryptographically secure.
6. Mark the user's outstanding unused tokens as consumed, then insert the new
   row with `expiresAt = now + 30 minutes`.
7. Send the email, awaited inline. On a Resend failure, delete the token row and
   return an error, so the user sees the failure instead of waiting for a mail
   that never arrives.
8. Respond with the destination masked: `Reset link sent to j••••@panesar.co.ke`.

### Completing a reset

1. `/reset-password/[token]` hashes the token from the URL and loads the row.
2. Missing, expired, or already-used tokens render an "invalid or expired link"
   state with a link back to `/forgot-password` — never the password form.
3. On submit, the action re-validates the token (the page render is not a
   trusted gate), then in one transaction:
   - write the new bcrypt hash to `users.password`
   - set `prompt_password_change = false` (phase 1 only; phase 2 drops the
     column and stamps `password_policy_version` here instead)
   - set `used_at` on the token, and mark the user's other outstanding
     tokens used, so the audit trail the table exists to provide is preserved
   - **delete every row in `sessions` for that user**, so an attacker holding a
     stolen session cookie is signed out by the reset
4. Redirect to `/login` with a success message.

Token validation lives in one exported helper used by both the page and the
action, so the two cannot drift apart.

## Password casing

`requiredStringSchemaEntry` (`src/lib/schema-rules.ts:14`) applies
`.toLowerCase()`, and both `loginSchema` and `changePasswordSchema` use it for
password fields. Verified behaviour:

```
loginSchema.parse({ password: 'xY7@2kQz' })  →  password: 'xy7@2kqz'
```

Two consequences today:

- Every stored password hash created through the change-password form is a hash
  of lowercased input, and login lowercases to match — so it works by accident.
- `hashPassword` in the admin flow hashes the raw generated password, which
  `generatePassword` builds from a mixed-case alphabet. A newly created user
  whose temporary password contains an uppercase letter **cannot log in at
  all**. This is a live bug, independent of this feature.

Password fields in `loginSchema`, `changePasswordSchema`, and the new reset
schema all move to `requiredTrimmedStringSchemaEntry`, which trims without
lowercasing.

### Migrating existing hashes

Switching login to case-preserving comparison would break every account whose
stored hash came from lowercased input. `loginAction` gets a transitional
fallback instead:

```
compare(input, hash)                    → success: done
compare(input.toLowerCase(), hash)      → success: re-hash `input` as typed,
                                          store it, continue the login
otherwise                               → invalid credentials
```

Each legacy account self-heals on its owner's next login, using their original
casing, with no lockout and no announcement. The fallback branch carries a
comment naming it as temporary and safe to delete once the fleet has cycled
through.

## Email

New template `src/emails/password-reset.tsx`, following the structure of
`src/emails/subscription-reminder.tsx`, and a `sendPasswordResetEmail` function
in `src/lib/resend.ts` alongside the existing sender.

The link needs an absolute origin, and no base-URL variable exists.
`APP_URL` joins `src/env/server.ts` as a required URL. `RESEND_FROM_EMAIL` is
currently optional there; the reset sender treats a missing value as a
configuration error rather than sending from a placeholder.

Content: greeting by first name, one action button, the raw URL as text for
clients that strip buttons, the 30-minute expiry stated plainly, and a line
telling recipients who did not request it to contact IT.

## Error handling

| Condition | Response |
|---|---|
| Validation failure | Field errors on the form, via `setFormErrors` |
| No matching user | `No account found for that email or contact.` |
| Inactive account | `That account is deactivated. Contact IT.` |
| Matched user, no email | `No email address on file for that account. Contact IT.` |
| Over throttle | `Too many reset requests. Try again in an hour.` |
| Resend failure | `Could not send the reset email. Try again shortly.` + token rolled back |
| Bad/expired/used token | Invalid-link page state with a link to request a new one |
| Password mismatch | Field error on the confirmation input |

## Testing

Vitest runs in a Node environment against `src/**/*.test.ts`. Unit coverage,
placed beside each implementation file:

- **Token helpers** — hashing is stable and one-way; generated tokens are
  URL-safe, unique across calls, and drawn from `crypto`.
- **Token state predicates** — expired, already-used, and valid tokens each
  classify correctly, with boundary cases at exactly the expiry instant.
- **Throttle window** — counts only tokens inside the trailing hour.
- **Schemas** — identifier accepts both shapes; password fields preserve case
  (a direct regression test for the bug above); confirmation mismatch is caught.
- **Login fallback** — case-preserving match, legacy lowercase match triggering
  a re-hash, and a genuine wrong password rejected.
- **Proxy matching** — extend `src/proxy.test.ts` so `/reset-password/<token>`
  is public while a protected path still redirects.

Database-touching action bodies are not unit tested, consistent with the rest
of the repo; the logic they depend on is extracted into the pure helpers above.

# Phase 2 — Password policy

## Why login, not the reset flow

Applying the policy only at password-reset time would reach just the users who
forgot their password. Everyone who remembers theirs — including the long-tenured
accounts most likely to hold a weak legacy password — would never encounter it.
Login is the only path every user takes, so that is where compliance is measured.

## Silent stamping

A bcrypt hash cannot be inspected, so there is no way to tell a strong stored
password from a weak one at rest. But `loginAction` holds the plaintext for a
moment after a successful `bcrypt.compare`. It runs the policy check there:

- **Passes** → stamp `password_policy_version = CURRENT_POLICY_VERSION` and
  continue. The user is never interrupted and never sees a banner.
- **Fails** → leave the version as-is; the user is non-compliant and will be
  nudged, then eventually gated.

This shrinks the forced-change population from *everyone* to *only users who
genuinely have a weak password*. It runs in the same place as the casing
self-heal, and the two share one post-compare hook.

The self-heal re-hash **must not** stamp compliance: it re-hashes a legacy
password that has not been checked against the policy.

## Data model

Added to `users`:

```
password_policy_version   smallint     not null default 0
password_changed_at       timestamptz  null
password_policy_exempt_until timestamptz null   -- admin-granted extension
```

`CURRENT_POLICY_VERSION` is a constant in code, starting at 1. Compliance is
`password_policy_version >= CURRENT_POLICY_VERSION` — derived, never stored as a
boolean, so tightening the policy later means bumping the constant and letting
the same machinery re-run.

Both `password_policy_version` and `password_changed_at` are written on **every**
password change — reset, self-service, and admin. There is no "skip if already
tracked" rule: the comparison is idempotent by construction, and always writing
`password_changed_at` preserves a genuine last-changed timestamp for audit and
any future expiry policy.

`prompt_password_change` is dropped in the phase 2 migration, replacing the
phase 1 write in the reset action. It is currently written in two
places and read in none, so the "force a change on first login" behaviour the
admin flow implies has never actually functioned.

## The policy rule

One exported predicate, `checkPasswordPolicy(password, user)`, returning the
failed requirements. The zod schema calls it server-side; the strength meter
calls the same function client-side. There is no second implementation to drift.

Requirements:

- at least 12 characters
- not containing, and not trivially derived from, the user's name, email local
  part, or contact number
- not matching a small blocklist: `password`, `panesar`, `aio`, sequential and
  keyboard runs, and single repeated characters

Deliberately **no** required character classes. Composition rules reliably push
users toward patterns like `Panesar@2026` that satisfy every rule while
remaining trivially guessable; length plus a personal-data blocklist is the
current NIST 800-63B guidance and is easier to explain.

The meter is advisory only — it scores length and character variety to give
feedback, but the gate is the predicate above. It is built from the existing
`@radix-ui/react-progress` dependency; no new package is added.

## Enforcement

The gate lives in `src/proxy.ts`, not in the protected layout. A layout-based
gate cannot work: `/change-password` sits inside `(protected)`, and App Router
server layouts cannot read the pathname, so "redirect the non-compliant to
/change-password" would redirect that page to itself. The proxy knows the path
and can exempt it.

`SessionPayload` gains a `policyCompliant` claim, set by `createSession` from the
value the caller already has in hand. The proxy reads it from the JWT it already
decrypts, so the gate costs no database query:

```
compliant claim true                → pass
claim absent (pre-deploy session)   → pass; refreshed at next login
deadline unset or not yet reached   → pass, banner shown
past deadline, exempt_until valid   → pass, banner shown
past deadline, not exempt           → redirect to /change-password
```

`/change-password`, `/login`, `/api/inngest`, and static assets are always
exempt. Changing a password re-issues the session with a fresh claim, so
compliance takes effect immediately rather than at next login.

This gate is a policy nudge, not a security boundary: it covers page
navigation, and a non-compliant user who called a server action directly would
still be served. That is acceptable — they are already authenticated, and the
policy protects against weak credentials, not against the account's own owner.

## Rollout

`PASSWORD_POLICY_DEADLINE` is an optional ISO date in `src/env/server.ts`. While
unset, the system stamps and nags but never gates — so the feature ships dark
and the hard gate is switched on by changing an environment variable, with no
deploy and no migration. Pushing the date back is equally cheap.

Non-compliant users see a banner in the protected layout, built on the existing
`custom-alert` component, stating the deadline and days remaining. It is
dismissible per session, and reappears on the next visit.

The banner is the primary notification channel. Email is not: `users.email` is
nullable, mail bounces silently, and the banner reaches precisely the population
that is actually using the system. Users who never log in during the grace
period are gated when they return, which is the correct outcome.

Admins can set `password_policy_exempt_until` on a user from the existing user
admin screen, for staff who are travelling or otherwise stuck.

### Outage risk

At the deadline, every non-compliant user is pushed through one form
simultaneously. If that form has a bug, nobody can work. Mitigations, in order
of importance: the deadline is an env var that can be cleared instantly; silent
stamping keeps the affected population small and measurable in advance; the
admin exemption is a per-user escape hatch; and the banner phase runs long
enough to watch the compliance rate climb before the gate closes.

Compliance is countable at any time with
`select count(*) from users where password_policy_version < 1 and active`.

## Admin-generated passwords

`generatePassword` moves from `Math.random()` to `crypto.randomInt` and from 8
characters to a length that satisfies the policy. Generated temporary passwords
are explicitly **not** stamped as compliant: they are sent over SMS in
plaintext, so the recipient must still set their own. The retired
`prompt_password_change` flag is replaced here by leaving
`password_policy_version` at 0, which routes the user through the same banner
and gate as everyone else.

## Phase 2 testing

- `checkPasswordPolicy` — each requirement independently, the boundary at
  exactly 12 characters, and personal-data rejection driven by name, email, and
  contact.
- Silent stamping — a strong legacy password stamps and does not interrupt; a
  weak one does not stamp; the casing self-heal never stamps.
- Compliance predicate — version below, equal to, and above the current constant.
- Deadline logic — unset deadline never gates; before, at, and after the
  deadline; a valid and an expired exemption.
- Proxy gate — non-compliant past deadline redirects, `/change-password` is
  exempt (no redirect loop), a missing claim passes.

## Out of scope

- SMS involvement in the reset flow
- Rate limiting beyond the per-user hourly cap
- Password expiry or rotation on a schedule
- Two-factor authentication
- Enforcing the policy at the server-action layer rather than on navigation
- Reworking Arcjet's `'anonymous'` sliding-window key, which lumps all
  signed-out traffic into one bucket (`src/proxy.ts:57`) — noted for follow-up
- Deleting the orphaned `verification_tokens` and `accounts` tables left over
  from a previous NextAuth setup
