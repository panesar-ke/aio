import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createRequire } from 'node:module';

/**
 * Read from the installed react rather than left as the `version: 'detect'`
 * eslint-config-next passes through.
 *
 * eslint-plugin-react resolves 'detect' through `context.getFilename()`, which
 * ESLint 10 removed, so every file threw `contextOrFilename.getFilename is not
 * a function` while loading react/display-name and the whole run died on the
 * first file. 7.37.5 is the latest published and peers on eslint <=9, so there
 * is no version to upgrade to; naming the version skips that code path.
 *
 * Delete this once eslint-plugin-react supports ESLint 10.
 */
const reactVersion = createRequire(import.meta.url)(
  'react/package.json'
).version;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { react: { version: reactVersion } } },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    },
  },
  {
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-imports': [
        'warn',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 1,
          internalPattern: ['^@/.*'],
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'ts-equals-import',
            'unknown',
          ],
        },
      ],
      'perfectionist/sort-named-imports': [
        'warn',
        { type: 'natural', order: 'asc' },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
