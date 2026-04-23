# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 App Router application. Primary code lives in `src/`.

- `src/app`: routes, layouts, API handlers, and route groups such as `(auth)` and `(protected)`.
- `src/features`: domain modules for `admin`, `auth`, `procurement`, `production`, and `store`; keep feature-specific components, services, and utils together here.
- `src/components`: shared UI, layout, and form primitives. `src/components/ui` contains shadcn-style building blocks.
- `src/drizzle`: database client, schemas, and SQL migrations.
- `src/inngest`: background jobs and event handlers.
- `public`: static assets served directly by Next.js.

Use the `@/*` path alias from `tsconfig.json` instead of long relative imports.

## Build, Test, and Development Commands
Use `pnpm` for local work because the repo ships with `pnpm-lock.yaml`.

- `pnpm dev`: start the Next.js dev server with Turbopack.
- `pnpm build`: create a production build.
- `pnpm start`: run the production server locally.
- `pnpm lint`: run Next.js lint checks.
- `pnpm lint:fix`: apply safe lint fixes.
- `pnpm lint:check`: run ESLint across `.ts`, `.tsx`, `.js`, and `.jsx`.
- `pnpm knip`: detect unused files and exports.
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push`: manage Drizzle schema changes.
- `pnpm inngest`: run the local Inngest dev server against `/api/inngest`.

## Coding Style & Naming Conventions
Write TypeScript with strict typing enabled. Follow the existing style: functional React components, PascalCase component files, and kebab-case or descriptive lowercase names for utilities and route folders. ESLint enforces `generic` array types (`Array<T>`) and consistent inline type imports. Keep shared primitives in `src/components/ui` and domain logic inside the relevant `src/features/*` module.

## Testing Guidelines
There is no formal test runner configured yet. Before opening a PR, run `pnpm lint` and `pnpm build`, then manually verify the affected route or API flow. When adding tests later, place them near the feature they cover and prefer `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `handle NaN` and `change how you check for main store`; keep that format, and use a `fix:` prefix only when it adds clarity. PRs should include a concise description, note any schema or environment changes, link the related issue, and attach screenshots for UI work.

## Security & Configuration Tips
Secrets belong in `.env` and should never be committed. Review `drizzle.config.ts`, `vercel.json`, and `src/env/{client,server}.ts` when changing deployment or environment-sensitive behavior.
