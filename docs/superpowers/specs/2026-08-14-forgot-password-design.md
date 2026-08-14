# Forgot Password — Design

**Date:** 2026-08-14
**Branch:** `feat/forgot-password`
**Status:** Approved for planning

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
   - set `prompt_password_change = false`
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

## Out of scope

- SMS involvement in the reset flow
- Rate limiting beyond the per-user hourly cap
- Password strength rules beyond the existing 8-character minimum
- Reworking Arcjet's `'anonymous'` sliding-window key, which lumps all
  signed-out traffic into one bucket (`src/proxy.ts:57`) — noted for follow-up
- Deleting the orphaned `verification_tokens` and `accounts` tables left over
  from a previous NextAuth setup
