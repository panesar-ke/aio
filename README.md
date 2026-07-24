# PKL Integrated System

Internal ERP-style web application for **Panesars Kenya Ltd**, covering procurement, store/inventory management, IT asset & license administration, and production job tracking — all behind role/permission-gated authentication.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack) + React 19 + TypeScript
- **Database:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-kit` for migrations/studio)
- **Background jobs:** [Inngest](https://www.inngest.com/) (e.g. license renewal reminders)
- **Email:** [Resend](https://resend.com/)
- **Security:** [Arcjet](https://arcjet.com/) (bot/rate-limit protection)
- **File uploads:** UploadThing
- **UI:** Tailwind CSS + Radix UI primitives, React Hook Form + Zod validation
- **Testing:** Vitest

## Modules

| Module | Description |
| --- | --- |
| **Procurement** | Vendors, products, purchase orders, material requisitions, order register, auto-orders (reorder-level based), order-by-criteria, top vendors, services |
| **Store** | Warehouses/stores, GRNs (goods received notes), material issues, material transfers, stock conversions |
| **IT** | Asset categories/assets/assignments, software license tracking with automated renewal reminders, IT expense & budget tracking |
| **Production** | CNC job tracker for manufacturing job-card progress |
| **Admin** | User management and a rights/permissions system controlling module access |

The database also carries a legacy HR/payroll schema (employees, leave, appraisals, etc.) inherited from a prior system; it is not currently exposed by any app feature.

## Getting Started

### Prerequisites

- Node.js
- pnpm
- A PostgreSQL database

### Environment Variables

Create a `.env` file with the following (see `src/env/server.ts` and `src/env/client.ts` for the full validated list):

```
DATABASE_URL=
NEXT_PUBLIC_API_URL=
SECONDARY_API_URL=
SMS_API_KEY=
SMS_USER_NAME=
SMS_SENDER_ID=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
IT_MANAGER_EMAIL=
CRON_SECRET=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
BCRYPT_ROUNDS=
SESSION_SECRET=
ARCJET_KEY=
```

### Install & Run

```bash
pnpm install
pnpm db:push      # sync schema to the database
pnpm dev          # start the dev server at http://localhost:3000
```

To run background jobs locally (e.g. license renewal reminders), start the Inngest dev server in a separate terminal:

```bash
pnpm inngest
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm lint` / `pnpm lint:fix` | Lint (and autofix) |
| `pnpm test` | Run Vitest test suite |
| `pnpm db:push` | Push schema changes directly to the database |
| `pnpm db:generate` | Generate SQL migration files from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:pull` | Introspect the database into schema files |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm knip` | Find unused files/exports/dependencies |

## Project Structure

```
src/
  app/            Next.js routes: (auth), (protected), api
  features/       Feature modules (procurement, store, it, production, admin, auth, ...)
  components/     Shared UI (ui primitives, layout, forms, custom)
  drizzle/        DB client, schema, and migrations
  inngest/        Background job functions
  emails/         Transactional email templates
  lib/            Shared utilities, actions, permissions
  hooks/          Shared React hooks
  env/            Validated environment variables (server/client)
```
