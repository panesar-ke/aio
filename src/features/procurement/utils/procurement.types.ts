import type z from 'zod';
import type { UseFormReturn } from 'react-hook-form';
import type {
  getMaterialRequisitions,
  getRequisition,
} from '@/features/procurement/services/material-requisitions/data';
import type {
  getPurchaseOrders,
  getPendingRequests,
  getPurchaseOrder,
} from '@/features/procurement/services/purchase-orders/data';
import type {
  materialRequisitionFormSchema,
  orderSchema,
  productsSchema,
  vendorSchema,
  serviceSchema,
  autoOrdersSchema,
  orderRegisterSchema,
  orderByCriteriaSchema,
  topVendorsSchema,
} from '@/features/procurement/utils/schemas';
import type {
  getVendorOrders,
  getVendors,
} from '@/features/procurement/services/vendors/data';
import type { products, services, vendors } from '@/drizzle/schema';
import type { getProducts } from '@/features/procurement/services/products/data';
import type {
  orderByProduct,
  orderByProject,
} from '@/features/procurement/services/reports/data';

export type MaterialRequisitionTableRow = Awaited<
  ReturnType<typeof getMaterialRequisitions>
>[number];
export type MaterialRequisitionFormValues = z.infer<
  typeof materialRequisitionFormSchema
>;

export type Requisition = Awaited<ReturnType<typeof getRequisition>>;

export type OrderTableRow = Awaited<
  ReturnType<typeof getPurchaseOrders>
>[number];
export type OrderFormValues = z.infer<typeof orderSchema>;
export type PendingOrder = Awaited<
  ReturnType<typeof getPendingRequests>
>[number];
export interface OrderForm {
  form: UseFormReturn<OrderFormValues>;
}

export type Order = Awaited<ReturnType<typeof getPurchaseOrder>>;

interface OrderItem {
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface OrderData {
  orderNumber: string;
  orderDate: Date;
  supplierName: string;
  supplierAddress?: string | null;
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  contactPerson?: string | null;
  taxPin?: string | null;
  vatType: OrderFormValues['vatType'];
  vatRate: number;
  items: Array<OrderItem>;
  userName: string;
}

export type VendorTableRow = Awaited<ReturnType<typeof getVendors>>[number];
export type VendorFormValues = z.infer<typeof vendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type VendorOrder = Awaited<ReturnType<typeof getVendorOrders>>[number];

export type ProductTableRow = Awaited<ReturnType<typeof getProducts>>[number];
export type ProductsFormValues = z.infer<typeof productsSchema>;
export type Product = typeof products.$inferSelect;

export type ServiceFormValues = z.infer<typeof serviceSchema>;
export type Service = typeof services.$inferSelect;

export type AutoOrderFormValues = z.infer<typeof autoOrdersSchema>;

export type OrderRegisterFormValues = z.infer<typeof orderRegisterSchema>;
export type OrderRegister = {
  id: number;
  documentDate: string;
  billDate: string | null;
  vendorName: string;
  billNo: string | null;
  totalDiscount: number;
  subTotal: number;
  vat: number;
  totalAmount: number;
};

export type OrderRegisterWithValues = Omit<
  OrderRegister,
  'totalDiscount' | 'subTotal' | 'vat' | 'totalAmount'
> & {
  itemName: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  totalPrice: string;
};

export type OrderByCriteriaFormValues = z.infer<typeof orderByCriteriaSchema>;

export type OrderByCriteriaProject = Awaited<
  ReturnType<typeof orderByProject>
>[number];
export type OrderByCriteriaProduct = Awaited<
  ReturnType<typeof orderByProduct>
>[number];

export type TopVendorFormValues = z.infer<typeof topVendorsSchema>;
export type TopVendor = {
  vendorName: string;
  totalAmount: number;
  discountedAmount: number;
};

export type ProcurementCacheTag =
  | 'material-requisitions'
  | 'material-requisition-no'
  | 'purchase-orders'
  | 'categories'
  | 'uoms'
  | 'products'
  | 'services'
  | 'projects'
  | 'vendors'
  | 'vendors_stats'
  | 'purchase-order-no'
  | 'auto-orders'
  | 'pending-requests';
