# Repository Guidelines

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` (resolved from this file's directory; in
monorepos the `next` package may not be visible from the repo root) before
writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at
`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a
diff only re-creates the uncommitted change; committing it with your work keeps
the tree clean.

## Project Structure & Module Organization

This is a Next.js 15 App Router application written in TypeScript. Route pages,
layouts, and API handlers live in `src/app/`; business domains such as
procurement, store, IT, production, admin, and auth belong in `src/features/`.
Reusable UI is organized under `src/components/`, shared hooks and utilities
under `src/hooks/` and `src/lib/`, and common types under `src/types/`.

Database schemas, the client, and generated migrations are in `src/drizzle/`.
Background jobs live in `src/inngest/`, email templates in `src/emails/`, static
assets in `public/`, and one-off maintenance utilities in `scripts/`.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies from the lockfile.
- `pnpm dev` starts the Turbopack development server on port 3000.
- `pnpm build` creates a production build; `pnpm start` serves it.
- `pnpm lint:check` runs ESLint across JavaScript and TypeScript files.
- `pnpm test` runs the Vitest suite once.
- `pnpm db:generate` creates Drizzle migrations; `pnpm db:migrate` applies them.
- `pnpm inngest` runs the local Inngest development server.
- `pnpm knip` reports unused files, exports, and dependencies.

## Coding Style & Naming Conventions

Follow the existing TypeScript/React style: two-space indentation, single
quotes, semicolons, and functional components. Use kebab-case filenames (for
example, `submit-button.tsx`), PascalCase component names, camelCase functions
and variables, and `type` imports where applicable. Prefer the `@/` alias for
imports from `src/`. ESLint enforces Next.js core-web-vitals, TypeScript rules,
consistent type imports, and naturally sorted import groups.

## Testing Guidelines

Vitest runs in a Node environment and discovers `src/**/*.test.ts`. Place tests
beside the implementation and name them `<subject>.test.ts`. Add focused tests
for business rules, date logic, cache behavior, and data-mutation contracts. Run
`pnpm test` and `pnpm lint:check` before opening a pull request.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, lowercase subjects such as
`add stock movement report page` and `extend with optional props`. Keep each
commit scoped to one logical change. Pull requests should explain the problem
and solution, note database or environment changes, link the relevant issue, and
include screenshots for visible UI changes. Report the commands used to verify
the change and call out generated migrations explicitly.

## Security & Configuration

Keep secrets in `.env`; never commit credentials. Environment variables are
validated in `src/env/server.ts` and `src/env/client.ts`. Review generated SQL
before applying migrations, and avoid `db:push` against shared or production
databases.
