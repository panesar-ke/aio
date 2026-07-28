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
  if (order?.reference) {
    return `order:${order.reference}`;
  }

  if (requisitionData) {
    return `requisition:${requisitionData.documentDate.toISOString()}:${requisitionData.details
      .map(detail => detail.id)
      .join(',')}`;
  }

  return `new:${orderNo}`;
}
