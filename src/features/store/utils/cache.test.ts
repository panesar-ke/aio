import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidateTag }));

import { revalidateMaterialsIssues } from '@/features/store/utils/cache';

describe('stock movement cache invalidation', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it('invalidates stock-balance after an issue mutation', () => {
    revalidateMaterialsIssues('issue-1');

    expect(revalidateTag).toHaveBeenCalledWith('stock-balance', 'max');
  });
});
