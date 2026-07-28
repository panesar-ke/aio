import type {
  Order,
  OrderFormValues,
  Requisition,
} from '@/features/procurement/utils/procurement.types';

export type OrderFormRequisitionData = {
  documentDate: Date;
  details: Requisition['mrqDetails'];
};

export function buildOrderFormDefaultValues({
  order,
  orderNo,
  requisitionData,
}: {
  order?: Order;
  orderNo: number;
  requisitionData?: OrderFormRequisitionData | null;
}): OrderFormValues {
  return {
    details:
      order?.ordersDetails.map(
        ({
          id,
          requestId,
          projectId,
          itemId,
          serviceId,
          qty,
          rate,
          discountType,
          discount,
        }) => ({
          id,
          requestId: requestId?.toString() || '',
          projectId,
          type: itemId ? 'item' : ('service' as const),
          itemOrServiceId: itemId || serviceId || '',
          qty: +qty,
          rate: parseFloat(rate),
          discountType: discountType || 'NONE',
          discount: discount ? parseFloat(discount) : 0,
        })
      ) ||
      requisitionData?.details.map(detail => ({
        id: detail.id,
        requestId: detail.requestId.toString(),
        projectId: detail.projectId,
        type: detail.itemId ? 'item' : ('service' as const),
        itemOrServiceId: detail.itemId || detail.serviceId || '',
        qty: +detail.qty,
        rate: detail.itemId
          ? +(detail.product?.buyingPrice ?? 0)
          : +(detail.service?.serviceFee ?? 0),
        discountType: 'NONE',
        discount: 0,
      })) ||
      [],
    documentDate: order?.documentDate
      ? new Date(order.documentDate)
      : requisitionData?.documentDate
        ? new Date(requisitionData.documentDate)
        : new Date(),
    displayOdometerDetails: false,
    vehicle: undefined,
    documentNo: orderNo,
    vendor: order?.vendor.id || '',
    invoiceNo: order?.billNo || '',
    vatType: order?.vatType || 'NONE',
    vat: order?.vatId ? order.vatId.toString() : '',
    invoiceDate: order?.billDate ? new Date(order.billDate) : undefined,
  };
}

export function getOrderFormSeedKey({
  order,
  orderNo,
  requisitionData,
}: {
  order?: Order;
  orderNo: number;
  requisitionData?: OrderFormRequisitionData | null;
}) {
  if (order) {
    const normalizedOrder = {
      orderNo,
      reference: order.reference ?? '',
      documentDate: order.documentDate
        ? new Date(order.documentDate).toISOString()
        : '',
      vendor: order.vendor?.id || '',
      invoiceNo: order.billNo || '',
      vatType: order.vatType || 'NONE',
      vat: order.vatId ? order.vatId.toString() : '',
      invoiceDate: order.billDate ? new Date(order.billDate).toISOString() : '',
      details: (order.ordersDetails || []).map(d => ({
        id: d.id,
        requestId: d.requestId?.toString() || '',
        projectId: d.projectId,
        type: d.itemId ? 'item' : ('service' as const),
        itemOrServiceId: d.itemId || d.serviceId || '',
        qty: +d.qty,
        rate: parseFloat(d.rate),
        discountType: d.discountType || 'NONE',
        discount: d.discount ? parseFloat(d.discount) : 0,
      })),
    };
    return `order:${JSON.stringify(normalizedOrder)}`;
  }

  if (requisitionData) {
    const normalizedRequisition = {
      orderNo,
      documentDate: requisitionData.documentDate
        ? new Date(requisitionData.documentDate).toISOString()
        : '',
      details: (requisitionData.details || []).map(detail => ({
        id: detail.id,
        requestId: detail.requestId.toString(),
        projectId: detail.projectId,
        type: detail.itemId ? 'item' : ('service' as const),
        itemOrServiceId: detail.itemId || detail.serviceId || '',
        qty: +detail.qty,
        rate: detail.itemId
          ? +(detail.product?.buyingPrice ?? 0)
          : +(detail.service?.serviceFee ?? 0),
      })),
    };
    return `requisition:${JSON.stringify(normalizedRequisition)}`;
  }

  return `new:${orderNo}`;
}
