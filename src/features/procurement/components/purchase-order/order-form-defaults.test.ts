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

    const requisitionData: OrderFormRequisitionData = {
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
    };

    const seedKey = getOrderFormSeedKey({
      orderNo: 42,
      requisitionData,
    });

    expect(seedKey).not.toBe('new:42');
    expect(seedKey).toContain('requisition:');
  });

  it('changes seed key for same-ID requisition details when qty, rate, item/service, or project change', () => {
    const baseReq: OrderFormRequisitionData = {
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
    };

    const keyOriginal = getOrderFormSeedKey({ orderNo: 42, requisitionData: baseReq });

    // 1. Qty changes
    const qtyChangedReq: OrderFormRequisitionData = {
      ...baseReq,
      details: [{ ...baseReq.details[0], qty: '10' }],
    };
    expect(getOrderFormSeedKey({ orderNo: 42, requisitionData: qtyChangedReq })).not.toBe(keyOriginal);

    // 2. Rate (product buyingPrice) changes
    const rateChangedReq: OrderFormRequisitionData = {
      ...baseReq,
      details: [
        {
          ...baseReq.details[0],
          product: { ...baseReq.details[0].product!, buyingPrice: '99.99' },
        },
      ],
    };
    expect(getOrderFormSeedKey({ orderNo: 42, requisitionData: rateChangedReq })).not.toBe(keyOriginal);

    // 3. Project changes
    const projectChangedReq: OrderFormRequisitionData = {
      ...baseReq,
      details: [{ ...baseReq.details[0], projectId: 'project-99' }],
    };
    expect(getOrderFormSeedKey({ orderNo: 42, requisitionData: projectChangedReq })).not.toBe(keyOriginal);

    // 4. Item/Service changes
    const itemChangedReq: OrderFormRequisitionData = {
      ...baseReq,
      details: [{ ...baseReq.details[0], itemId: 'item-2' }],
    };
    expect(getOrderFormSeedKey({ orderNo: 42, requisitionData: itemChangedReq })).not.toBe(keyOriginal);
  });

  it('changes seed key when order default-affecting fields change', () => {
    const baseOrder = {
      id: 1,
      reference: 'PO-100',
      documentDate: new Date('2026-07-28T00:00:00.000Z'),
      billNo: 'INV-1',
      billDate: new Date('2026-07-28T00:00:00.000Z'),
      vatType: 'EXCLUSIVE' as const,
      vatId: 1,
      vendor: { id: 'vendor-1', name: 'Vendor 1' },
      ordersDetails: [
        {
          id: 'od-1',
          requestId: 10,
          projectId: 'project-1',
          itemId: 'item-1',
          serviceId: null,
          qty: 5,
          rate: '15.00',
          discountType: 'NONE' as const,
          discount: '0',
        },
      ],
    } as unknown as Parameters<typeof getOrderFormSeedKey>[0]['order'];

    const keyOriginal = getOrderFormSeedKey({ orderNo: 42, order: baseOrder });

    const orderWithQtyChanged = {
      ...baseOrder,
      ordersDetails: [
        {
          ...baseOrder!.ordersDetails[0],
          qty: 20,
        },
      ],
    } as unknown as Parameters<typeof getOrderFormSeedKey>[0]['order'];

    expect(getOrderFormSeedKey({ orderNo: 42, order: orderWithQtyChanged })).not.toBe(keyOriginal);
  });
});
