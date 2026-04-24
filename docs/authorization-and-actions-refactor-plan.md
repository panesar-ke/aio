# Authorization + Actions Refactor Plan

This plan is intentionally **incremental** so you can secure critical paths first (High priority), then simplify repeated server-action patterns (Medium priority) without risky rewrites.

## Goals

1. Enforce authorization on **server-side execution paths** (server actions, data loaders, API routes), not just navigation.
2. Introduce a **type-safe permission model** using `action:resource` strings.
3. Add lightweight client/server permission gates for UI conditions.
4. Refactor server actions with small shared helpers (no heavy abstraction).

---

## Part 1 — Authorization (High)

## 1) Introduce typed permissions (`action:resource`)

Create a central permission catalog.

- New file: `src/lib/permissions/catalog.ts`
- Define:
  - `PERMISSIONS` constant array (`as const`) with entries like:
    - `view:users`
    - `create:it-category`
    - `update:it-expenses`
    - `delete:material-requisition`
  - `export type Permission = (typeof PERMISSIONS)[number]`

Keep this file as the single source of truth for all valid permissions.

## 2) Map permissions to routes/forms (bridge existing rights)

Current rights are form-based (`user_rights` + `forms`). Use this as a bridge to avoid massive migration.

- New file: `src/lib/permissions/mapping.ts`
- Add map(s):
  - `formPath -> permission[]`
  - optional `formId -> permission[]` if needed in server checks.

This lets you keep `/admin/rights` UX while gaining permission checks.

## 3) Add permission resolver + cache

- New file: `src/lib/permissions/service.ts`
- Add:
  - `getCurrentUserPermissions(): Promise<Set<Permission>>`
    - uses `getCurrentUser()` + existing rights query (`forms` joined to `user_rights`) to resolve permissions.
    - `ADMIN`/`SUPER ADMIN` can get wildcard behavior (e.g., full set) to minimize rollout friction.
  - `hasPermission(permission: Permission): Promise<boolean>`
  - `hasAnyPermission(permissions: Permission[]): Promise<boolean>`

Use `cache` where appropriate to avoid repeated DB calls per request render.

## 4) Server guard primitives

- New file: `src/lib/permissions/guards.ts`
- Implement:

```ts
export async function requirePermission(permission: Permission): Promise<void>
export async function requireAnyPermission(permissions: Permission[]): Promise<void>
```

Behavior:
- If unauthenticated: redirect `/login` for page/action usage, or throw `UnauthorizedError` for API handlers.
- If authenticated but forbidden: throw a dedicated `ForbiddenError`.

Also add HOF wrapper:

```ts
export function withPermission<T extends unknown[], R>(
  permission: Permission,
  action: (ctx: { id: string; userType: User['userType'] }, ...args: T) => Promise<R>
): (...args: T) => Promise<R>
```

This supports your preferred style while keeping implementation simple.

## 5) Protect high-risk paths first (phased rollout)

### Phase A (immediate)

Protect these first:

- `src/app/api/admin/user-rights/[userId]/route.ts`
  - currently checks only logged-in user; add stricter permission (e.g. `view:user-rights` or admin-only).
- `src/features/admin/services/action.ts`
  - replace repeated `user.userType === 'STANDARD USER'` checks with `requirePermission(...)`.
- Start with mutation actions in:
  - `src/features/procurement/services/**/actions.ts`
  - `src/features/it/services/expenses/actions.ts`

### Phase B

Protect critical data fetching functions that expose sensitive data, not only mutating actions.

### Phase C

Audit remaining server actions/routes and add permission requirement at top of each action.

## 6) Permission gate components

### Server component gate

- New file: `src/components/auth/server-permission-gate.tsx`
- Async component that checks permission(s) and renders `children` or `fallback`.

### Client component gate

- New file: `src/components/auth/client-permission-gate.tsx`
- Use preloaded permissions via context/provider (or a lightweight API endpoint) to avoid repeated requests.

Suggested API:

```tsx
<PermissionGate
  permissions={['view:expenses', 'view:budgets']}
  mode="any" // or "all"
  loadingComponent={...}
  fallback={...}
>
  {children}
</PermissionGate>
```

Keep gates for UX only; **never** rely on them for security.

## 7) Unauthorized behavior (recommended)

Use this rule for consistency:

- **Server actions / API / data access**: return `403` (or throw `ForbiddenError`) — do not silently redirect.
- **Page navigation (UI route)**: render a dedicated `403` page or redirect to `/unauthorized`.

Why:
- preserves debuggability
- avoids hiding permission bugs
- clearer for user and logs

Implement a shared `forbidden()` helper or error class to standardize responses.

## 8) Migration approach for `/admin/rights`

To avoid breaking existing setup:

1. Keep current `user_rights` assignment UI.
2. Extend `forms` metadata (or add mapping config file) to include default permissions per form.
3. Resolve effective user permissions from assigned forms.
4. Later (optional): add dedicated `permissions` + `role_permissions` tables if you need granular cross-form controls.

This keeps implementation simple now, while allowing future evolution.

---

## Part 2 — Actions refactor (Medium)

You are right: many actions follow the same skeleton (validate → authorize → query/mutate → handle error). That duplication is normal, but you can reduce the noisy parts safely.

## 1) Add a tiny action helper (not a framework)

- New file: `src/lib/actions/safe-action.ts`

Add small utilities:

1. `parseOrFail(schema, values)`
   - wraps `validateFields` / `safeParse` into one consistent return type.

2. `runAction(name, fn)`
   - wraps `try/catch`
   - logs standardized errors
   - returns standardized failure shape:
     - `{ error: true, message: '...' }`

3. Optional helpers:
   - `ensureId(id, label)` for repeated ID checks.

This removes repetitive boilerplate without hiding domain logic.

## 2) Standardize action result type

- New file: `src/lib/actions/types.ts`

```ts
export type ActionResult<T = undefined> =
  | { error: false; message: string; data?: T }
  | { error: true; message: string }
```

Then progressively adopt in service action files.

## 3) Refactor by feature, not globally

Refactor one file at a time, for example:

1. `src/features/it/services/expenses/actions.ts` (small and clean)
2. `src/features/procurement/services/products/actions.ts`
3. `src/features/procurement/services/vendors/actions.ts`

Do not refactor everything in one PR.

## 4) Suggested action shape after refactor

Each action should read like:

1. `await requirePermission(...)`
2. `const data = parseOrFail(...)`
3. domain checks (uniqueness/reference)
4. DB mutation
5. cache revalidation
6. return success result / redirect

This preserves readability and makes authorization easy to enforce consistently.

---

## Rollout checklist

1. Add permission catalog + resolver + guards.
2. Protect admin API + admin actions first.
3. Protect procurement/IT mutation actions.
4. Add server/client `PermissionGate` for UX.
5. Introduce small safe-action helpers.
6. Refactor 1–2 action files and validate behavior.
7. Continue feature-by-feature.

---

## Notes specific to current codebase

- `src/app/api/admin/user-rights/[userId]/route.ts` currently allows any authenticated user to fetch rights for any user ID. This should be restricted immediately.
- `src/features/admin/services/action.ts` mixes permission checks (`userType`) directly in actions; move this to centralized guards.
- Existing sidebar form filtering (`getUserForms`) is good for navigation UX, but should not be treated as backend authorization.

