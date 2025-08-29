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

export const materialTransferFormSchema = z
  .object({
    transferDate: requiredDateSchemaEntry(),
    fromStoreId: requiredStringSchemaEntry('From store is required'),
    toStoreId: requiredStringSchemaEntry('To store is required'),
    items: z.array(
      z
        .object({
          id: requiredStringSchemaEntry('ID is required'),
          itemId: requiredStringSchemaEntry('Item is required'),
          transferredQty: requiredNumberSchemaEntry(
            'Transferred Qty is required'
          ),
          stockBalance: optionalNumberSchemaEntry(),
          remarks: optionalStringSchemaEntry(),
        })
        .superRefine(({ transferredQty, stockBalance }, ctx) => {
          if (transferredQty > (stockBalance ?? 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Transferred Qty cannot be greater than Stock Balance',
              path: ['transferredQty'],
            });
          }
        })
    ),
  })
  .superRefine(({ fromStoreId, toStoreId, items }, ctx) => {
    if (fromStoreId === toStoreId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From and To stores must be different',
        path: ['toStoreId'],
      });
    }
    if (items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one item is required',
        path: ['items'],
      });
    }
    const itemIds = items.map(item => item.itemId);
    if (new Set(itemIds).size !== itemIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Items must have unique IDs',
      });
    }
  });
