import { describe, expect, it } from 'vitest';

import {
  buildOrderFormDefaultValues,
  getOrderFormSeedKey,
  type OrderFormRequisitionData,
} from '@/features/procurement/components/purchase-order/order-form-defaults';

describe('buildOrderFormDefaultValues', () => {
  it('seeds a new order form from requisition data', () => {
    const defaults = buildOrderFormDefaultValues({
      orderNo: 42,
      requisitionData: {
        documentDate: new Date('2026-07-28T00:00:00.000Z'),
        details: [
          {
            headerId: 42,
            id: 'detail-1',
            itemId: 'item-1',
            linked: false,
            product: {
              id: 'item-1',
              productName: 'Widget',
              buyingPrice: '12.50',
              uom: null,
            },
            projectId: 'project-1',
            qty: '3',
            remarks: null,
            requestId: 7,
            service: null,
            serviceId: null,
            unitId: 1,
            project: {
              id: 'project-1',
              projectName: 'Project A',
            },
          },
        ],
      } satisfies OrderFormRequisitionData,
    });

    expect(defaults.documentNo).toBe(42);
    expect(defaults.details).toEqual([
      {
        id: 'detail-1',
        requestId: '7',
        projectId: 'project-1',
        type: 'item',
        itemOrServiceId: 'item-1',
        qty: 3,
        rate: 12.5,
        discountType: 'NONE',
        discount: 0,
      },
    ]);
  });
});

describe('getOrderFormSeedKey', () => {
  it('changes when a requisition-backed seed is provided', () => {
    expect(getOrderFormSeedKey({ orderNo: 42, requisitionData: null })).toBe(
      'new:42'
    );

    expect(
      getOrderFormSeedKey({
        orderNo: 42,
        requisitionData: {
          documentDate: new Date('2026-07-28T00:00:00.000Z'),
          details: [
            {
              headerId: 42,
              id: 'detail-1',
              itemId: 'item-1',
              linked: false,
              product: {
                id: 'item-1',
                productName: 'Widget',
                buyingPrice: '12.50',
                uom: null,
              },
              projectId: 'project-1',
              qty: '3',
              remarks: null,
              requestId: 7,
              service: null,
              serviceId: null,
              unitId: 1,
              project: {
                id: 'project-1',
                projectName: 'Project A',
              },
            },
            {
              headerId: 42,
              id: 'detail-2',
              itemId: null,
              linked: false,
              product: null,
              projectId: 'project-2',
              qty: '2',
              remarks: null,
              requestId: 8,
              service: {
                id: 'service-1',
                serviceFee: 20,
                serviceName: 'Service A',
              },
              serviceId: 'service-1',
              unitId: 1,
              project: {
                id: 'project-2',
                projectName: 'Project B',
              },
            },
          ],
        } satisfies OrderFormRequisitionData,
      })
    ).toBe('requisition:2026-07-28T00:00:00.000Z:detail-1,detail-2');
  });
});
