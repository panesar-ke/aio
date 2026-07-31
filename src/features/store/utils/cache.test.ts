import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidateTag }));

import {
  revalidateMaterialsIssues,
  revalidateProductDeactivation,
} from '@/features/store/utils/cache';

describe('stock movement cache invalidation', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it('invalidates stock-balance after an issue mutation', () => {
    revalidateMaterialsIssues('issue-1');

    expect(revalidateTag).toHaveBeenCalledWith('stock-balance', 'max');
  });
});

describe('product deactivation cache invalidation', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it('revalidates the global tag always, and the id tag when a batchId is given', () => {
    revalidateProductDeactivation('batch-1');

    expect(revalidateTag).toHaveBeenCalledWith(
      'global:product-deactivation-batches',
      'max',
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      'id:batch-1-product-deactivation-batches',
      'max',
    );
  });

  it('revalidates only the global tag when no batchId is given', () => {
    revalidateProductDeactivation();

    expect(revalidateTag).toHaveBeenCalledWith(
      'global:product-deactivation-batches',
      'max',
    );
    expect(revalidateTag).not.toHaveBeenCalledWith(
      expect.stringContaining('id:'),
      'max',
    );
  });
});
