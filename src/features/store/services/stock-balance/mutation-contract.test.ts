import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mutationFiles = [
  'src/features/store/services/conversions/action.ts',
  'src/features/store/services/grns/actions.ts',
  'src/features/store/services/issues/actions.ts',
  'src/features/store/services/transfers/actions.ts',
];

describe('stock movement mutation contract', () => {
  it.each(mutationFiles)(
    '%s invalidates snapshots in the transaction and the report cache after it',
    file => {
      const source = readFileSync(path.resolve(file), 'utf8');

      expect(source).toContain('invalidateStockBalanceSnapshots(');
      expect(source).toMatch(/revalidate[A-Za-z]*(?:Tag|Issues|Balance)\(/);
    },
  );
});
