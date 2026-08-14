# Next.js 16.3 and TypeScript 7 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the app to Next.js `16.3.x` and TypeScript `7.x` without losing working linting, tests, or production builds.

**Architecture:** Keep ecosystem tools that still depend on the legacy TypeScript API pointed at the TypeScript 6 compatibility package exposed as `typescript`, while introducing a separate TS7 package for compiler execution and Next.js build integration. Apply only the minimum config changes needed in `package.json`, `next.config.ts`, and `tsconfig.json`, then verify the whole repo with install, lint, tests, TS7 type-check, and production build.

**Tech Stack:** Next.js App Router, React 19, TypeScript, pnpm, ESLint, typescript-eslint, Vitest, Knip

## Global Constraints

- Keep the compatibility split: tooling resolves `typescript` from the TS6 compatibility alias, and dedicated compiler execution uses a separate TS7 package alias.
- Preserve existing React 19 and app-router patterns unless the upgrade forces a change.
- Prefer the minimum change set required to restore green verification.
- Verification must include `pnpm install`, `pnpm lint:check`, `pnpm test`, `pnpm build`, and an explicit TS7 type-check command if one is added.
- Do not relax type-checking or linting to force the upgrade through.

---

### Task 1: Upgrade dependencies and expose TS7 compiler entrypoints

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: existing dependency graph in `package.json`
- Produces: updated package versions, a TS6 compatibility `typescript` package, a TS7 alias package, and explicit scripts for TS7 compiler execution if needed

- [ ] **Step 1: Write the failing dependency-resolution test**

Use `package.json` itself as the contract. The expected upgraded state is:

```json
{
  "dependencies": {
    "next": "16.3.x"
  },
  "devDependencies": {
    "@next/eslint-plugin-next": "^16.3.x",
    "eslint-config-next": "^16.3.x",
    "typescript": "npm:@typescript/typescript6@*"
  }
}
```

and a separate TS7 alias package plus an explicit TS7 script such as:

```json
{
  "devDependencies": {
    "typescript-native": "npm:typescript@^7.0.0"
  },
  "scripts": {
    "typecheck": "typescript-native --noEmit -p tsconfig.json"
  }
}
```

- [ ] **Step 2: Run a targeted package assertion to verify the current repo fails this contract**

Run: `node -e "const p=require('./package.json'); const ok=p.dependencies.next.startsWith('16.3.') && p.devDependencies['eslint-config-next']?.startsWith('^16.3.') && p.devDependencies['@next/eslint-plugin-next']?.startsWith('^16.3.') && String(p.devDependencies.typescript||'').includes('@typescript/typescript6') && p.devDependencies['typescript-native'] && p.scripts.typecheck; if (ok) process.exit(0); console.error('upgrade contract missing'); process.exit(1)"`

Expected: FAIL with `upgrade contract missing`

- [ ] **Step 3: Write the minimal implementation**

Update `package.json` to:

```json
{
  "scripts": {
    "typecheck": "typescript-native --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "next": "16.3.x"
  },
  "devDependencies": {
    "@next/eslint-plugin-next": "^16.3.x",
    "eslint-config-next": "^16.3.x",
    "typescript": "npm:@typescript/typescript6@*",
    "typescript-native": "npm:typescript@^7.0.0"
  }
}
```

Then run `pnpm install` to refresh `pnpm-lock.yaml`.

- [ ] **Step 4: Run the package assertion again**

Run: `node -e "const p=require('./package.json'); const ok=p.dependencies.next.startsWith('16.3.') && p.devDependencies['eslint-config-next']?.startsWith('^16.3.') && p.devDependencies['@next/eslint-plugin-next']?.startsWith('^16.3.') && String(p.devDependencies.typescript||'').includes('@typescript/typescript6') && p.devDependencies['typescript-native'] && p.scripts.typecheck; if (ok) process.exit(0); console.error('upgrade contract missing'); process.exit(1)"`

Expected: PASS with exit code `0`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "upgrade next and split typescript tooling"
```

### Task 2: Align Next.js and TypeScript configuration with the compatibility split

**Files:**
- Modify: `next.config.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: upgraded dependencies from Task 1
- Produces: Next config that uses the TS CLI path required by the Next 16.3/TS7 compatibility setup, and TS config with explicit Node globals available under TS7

- [ ] **Step 1: Write the failing config test**

Create a config contract with these expectations:

```ts
// next.config.ts
experimental: {
  useTypeScriptCli: true,
}
```

and:

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

- [ ] **Step 2: Run the config assertion to verify it fails**

Run: `node -e "const fs=require('fs'); const ts=JSON.parse(fs.readFileSync('tsconfig.json','utf8')); const next=fs.readFileSync('next.config.ts','utf8'); const ok=Array.isArray(ts.compilerOptions?.types) && ts.compilerOptions.types.includes('node') && next.includes('useTypeScriptCli: true'); if (ok) process.exit(0); console.error('config contract missing'); process.exit(1)"`

Expected: FAIL with `config contract missing`

- [ ] **Step 3: Write the minimal implementation**

Update `next.config.ts` to add the TypeScript CLI compatibility option while preserving existing config:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
```

Update `tsconfig.json` to add:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

- [ ] **Step 4: Run the config assertion again**

Run: `node -e "const fs=require('fs'); const ts=JSON.parse(fs.readFileSync('tsconfig.json','utf8')); const next=fs.readFileSync('next.config.ts','utf8'); const ok=Array.isArray(ts.compilerOptions?.types) && ts.compilerOptions.types.includes('node') && next.includes('useTypeScriptCli: true'); if (ok) process.exit(0); console.error('config contract missing'); process.exit(1)"`

Expected: PASS with exit code `0`

- [ ] **Step 5: Commit**

```bash
git add next.config.ts tsconfig.json
git commit -m "configure next and ts for typescript 7"
```

### Task 3: Verify the upgraded toolchain and fix any upgrade regressions

**Files:**
- Modify: any repo file required by failing verification, minimum scope only
- Verify: `package.json`
- Verify: `next.config.ts`
- Verify: `tsconfig.json`

**Interfaces:**
- Consumes: upgraded dependencies and configs from Tasks 1-2
- Produces: a repo that installs, lints, type-checks, tests, and builds successfully on the new version split

- [ ] **Step 1: Write the failing verification target**

The upgraded repo is not complete until all of these pass:

```bash
pnpm install
pnpm lint:check
pnpm typecheck
pnpm test
pnpm build
```

- [ ] **Step 2: Run the full verification sequence and capture the first failure**

Run the commands in order:

```bash
pnpm install
pnpm lint:check
pnpm typecheck
pnpm test
pnpm build
```

Expected: at least one command may fail on the first run after upgrade

- [ ] **Step 3: Write the minimal implementation for each failure**

For each failing command:

- adjust dependencies if the split package names or versions need correction
- adjust config if the installed Next.js release expects a slightly different compatibility option shape
- make the smallest source or config fix necessary to restore compatibility

Do not move to the next command until the current one passes cleanly.

- [ ] **Step 4: Re-run the full verification sequence until all commands pass**

Run:

```bash
pnpm install
pnpm lint:check
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands PASS with exit code `0`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json .
git commit -m "finish next 16.3 and typescript 7 upgrade"
```
