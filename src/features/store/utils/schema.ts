import { z } from 'zod';
import {
  optionalNumberSchemaEntry,
  optionalStringSchemaEntry,
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules';

export const storeFormSchema = z.object({
  storeName: requiredStringSchemaEntry('Store name is required'),
  description: requiredStringSchemaEntry('Description is required'),
});

export const grnFormSchema = z.object({
  receiptDate: requiredDateSchemaEntry(),
  orderId: requiredStringSchemaEntry('Order is required'),
  invoiceNo: optionalStringSchemaEntry(),
  vendorId: requiredStringSchemaEntry('Vendor is required'),
  vendorName: requiredStringSchemaEntry('Vendor is required'),
  storeId: requiredStringSchemaEntry('Store is required'),
  items: z.array(
    z.object({
      id: requiredStringSchemaEntry('ID is required'),
      itemId: requiredStringSchemaEntry('Item is required'),
      productName: requiredStringSchemaEntry('Item is required'),
      orderedQty: requiredNumberSchemaEntry('ordered Qty is required'),
      qty: requiredNumberSchemaEntry('Qty must be a positive number'),
      rate: optionalNumberSchemaEntry(),
      remarks: optionalStringSchemaEntry(),
    })
  ),
});
