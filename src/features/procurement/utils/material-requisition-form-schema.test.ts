import { describe, expect, it } from 'vitest';

import { materialRequisitionFormSchema } from '@/features/procurement/utils/schemas';

describe('materialRequisitionFormSchema', () => {
  it('rejects requisition lines without a numeric temporary requestId', () => {
    const result = materialRequisitionFormSchema.safeParse({
      documentNo: 42,
      documentDate: '2026-07-31',
      details: [
        {
          id: 'local-line-1',
          projectId: 'project-1',
          type: 'item',
          itemOrServiceId: 'item-1',
          qty: 2,
          remarks: 'urgent',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('allows new requisition lines with a numeric temporary requestId', () => {
    const result = materialRequisitionFormSchema.safeParse({
      documentNo: 42,
      documentDate: '2026-07-31',
      details: [
        {
          id: 'local-line-1',
          projectId: 'project-1',
          type: 'item',
          itemOrServiceId: 'item-1',
          qty: 2,
          remarks: 'urgent',
          requestId: -1,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('keeps existing persisted requestId values valid', () => {
    const result = materialRequisitionFormSchema.safeParse({
      id: 'req-1',
      documentNo: 42,
      documentDate: '2026-07-31',
      details: [
        {
          id: 'db-line-1',
          projectId: 'project-1',
          type: 'item',
          itemOrServiceId: 'item-1',
          qty: 2,
          remarks: 'urgent',
          requestId: 1001,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
