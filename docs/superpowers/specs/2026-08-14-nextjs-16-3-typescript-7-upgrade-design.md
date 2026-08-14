# Next.js 16.3 and TypeScript 7 Upgrade Design

## Goal

Upgrade this application from Next.js `16.2.12` to `16.3.x` and from TypeScript `5.9.3` to `7.x` while keeping development tooling functional. The upgrade must preserve working linting, tests, and production builds.

## Constraints

- The repository is a Next.js App Router application using TypeScript.
- The current toolchain includes `eslint-config-next`, `@typescript-eslint/*`, `knip`, `vitest`, and `tsx`.
- `TypeScript 7.0` is not a drop-in replacement for the surrounding tool ecosystem because some tools still depend on the legacy TypeScript API.
- The repo currently relies on Node globals such as `process` and `Buffer`, so TS7's changed default type inclusion must be handled explicitly.
- Changes must be verified with install, lint, test, and build commands.

## Approaches Considered

### 1. Full TS7 everywhere

Upgrade every TypeScript consumer to `7.x` and let all tools use it directly.

Trade-offs:
- Simplest dependency graph.
- High risk because current versions of `@typescript-eslint` and `knip` in this repo declare incompatible TypeScript peer ranges.
- Likely to break linting or analysis even if the app type-checks.

### 2. Recommended compatibility split

Run the TS7 compiler for type-checking and Next.js builds, while keeping API-dependent tools on the TypeScript 6 compatibility package described in the TS7 announcement.

Trade-offs:
- Slightly more configuration.
- Matches the documented migration path for tools that have not fully moved to the TS7 API.
- Gives the best chance of upgrading both Next.js and TypeScript now without losing lint/build/test coverage.

### 3. Next.js-only upgrade

Upgrade to Next.js `16.3.x` but stay on TypeScript `5.9.x`.

Trade-offs:
- Lowest risk.
- Does not satisfy the requirement to upgrade TypeScript.

## Recommended Design

Use the compatibility split.

### Dependencies

- Upgrade `next`, `eslint-config-next`, and `@next/eslint-plugin-next` to `16.3.x`.
- Keep `react`, `react-dom`, `@types/react`, and `@types/react-dom` aligned with the installed Next.js line if package resolution requires it.
- Replace the direct `typescript` dependency with the TS6 compatibility alias so tooling that expects the legacy API can continue to resolve `typescript`.
- Add a separate TS7 package alias for the actual TS7 compiler binary and runtime.

### Configuration

- Update `next.config.ts` to enable the documented Next.js path that shells out to the TypeScript CLI rather than depending on the legacy in-process TypeScript API, if that option is still required by the installed `16.3.x` release.
- Update `tsconfig.json` to explicitly include Node types so files that use `process` and `Buffer` continue to type-check under TS7.
- Add scripts for explicit TS7 type-check execution if the package alias does not automatically integrate with the existing scripts.

### Tooling Behavior

- `eslint` should continue to resolve the compatibility `typescript` package.
- `knip` should continue to resolve the compatibility `typescript` package.
- Next.js builds and dedicated type-check commands should use TS7.

### Code Impact Expectations

The application code is expected to need little or no source-level migration because:

- `moduleResolution: 'bundler'` is already set.
- `strict: true` is already enabled.
- `esModuleInterop: true` is already enabled.
- No deprecated TypeScript options that are obvious TS7 breakpoints are currently configured.

The most likely source change is explicit `types` configuration in `tsconfig.json`.

## Testing Strategy

Verification will use the repository's existing commands plus any new explicit TS7 check command:

- `pnpm install`
- `pnpm lint:check`
- `pnpm test`
- `pnpm build`
- explicit TS7 type-check command if needed

If lint or build failures surface, they will be fixed in the minimum scope necessary to restore the repo to a clean upgraded state.

## Files Expected To Change

- `package.json`
- `pnpm-lock.yaml`
- `next.config.ts`
- `tsconfig.json`
- Possibly small supporting config files if needed for the TS7 compatibility split

## Success Criteria

- Next.js is upgraded to `16.3.x`.
- TypeScript 7 is introduced successfully.
- Linting works.
- Tests pass.
- Production build passes.
- The repo retains a clear documented path for why lint tooling and the compiler use different TypeScript packages during the ecosystem transition.
