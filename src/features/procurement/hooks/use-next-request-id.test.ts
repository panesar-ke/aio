import { describe, expect, it } from 'vitest';

import {
  buildDefaultDetails,
  getNextTemporaryRequestId,
} from '@/features/procurement/hooks/use-next-request-id';

describe('buildDefaultDetails', () => {
  it('includes a negative temporary requestId on a new default line', () => {
    const details = buildDefaultDetails();

    expect(details).toHaveLength(1);
    expect(details[0]).toHaveProperty('requestId', -1);
  });

  it('keeps persisted requestId on existing requisition lines', () => {
    const details = buildDefaultDetails({
      mrqDetails: [
        {
          id: 'detail-1',
          itemId: 'item-1',
          projectId: 'project-1',
          qty: '2',
          remarks: 'note',
          requestId: 17,
          serviceId: null,
        },
      ],
    } as never);

    expect(details[0]).toHaveProperty('requestId', 17);
  });

  it('allocates the next temporary requestId below existing temporary ids', () => {
    const nextRequestId = getNextTemporaryRequestId([
      {
        id: 'detail-1',
        type: 'item',
        projectId: 'project-1',
        itemOrServiceId: 'item-1',
        qty: 1,
        remarks: 'note',
        requestId: -2,
      },
      {
        id: 'detail-2',
        type: 'service',
        projectId: 'project-2',
        itemOrServiceId: 'service-1',
        qty: 1,
        remarks: 'note',
        requestId: 17,
      },
    ]);

    expect(nextRequestId).toBe(-3);
  });
});
