import type { Order } from '@/features/procurement/utils/procurement.types';

export const formatOrderForFileGeneration = (data: Order) => {
  return {
    orderDate: new Date(data.documentDate),
    orderNumber: data.id.toString(),
    supplierName: data.vendor.vendorName,
    supplierAddress: data.vendor?.address,
    supplierPhone: data.vendor?.contact,
    supplierEmail: data.vendor?.email,
    contactPerson: data.vendor?.contactPerson,
    taxPin: data.vendor?.kraPin,
    vatType: data.vatType,
    vatRate: data.vatId ? (data.vatId === 1 ? 16 : 0) : 0,
    items: data.ordersDetails.map(
      ({ product, service, qty, rate, discountedAmount, itemId }) => ({
        itemName: (itemId
          ? product?.productName
          : service?.serviceName) as string,
        quantity: parseFloat(qty),
        unit: itemId ? (product?.uom?.abbreviation as string) : 'DEF',
        unitPrice: parseFloat(rate),
        discount: parseFloat(discountedAmount) ?? 0,
        totalPrice:
          parseFloat(rate) * parseFloat(qty) -
          (parseFloat(discountedAmount) ?? 0),
      })
    ),
    userName: data.user.name,
  };
};
