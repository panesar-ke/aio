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
      orderedQty: z.coerce.number({
        required_error: 'Field is required',
        invalid_type_error: 'Field must be a number',
      }),
      qty: z.coerce.number({
        required_error: 'Field is required',
        invalid_type_error: 'Field must be a number',
      }),
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

export const materialIssueFormSchema = z.object({
  issueNo: requiredNumberSchemaEntry('Issue No is required'),
  issueDate: requiredDateSchemaEntry(),
  staffIssued: requiredStringSchemaEntry('Staff is required.'),
  fromStoreId: requiredStringSchemaEntry('From store is required.'),
  notes: optionalStringSchemaEntry(),
  jobcardNo: optionalStringSchemaEntry(),
  items: z.array(
    z.object({
      id: requiredStringSchemaEntry('ID is required'),
      itemId: requiredStringSchemaEntry('Item is required'),
      stockBalance: requiredNumberSchemaEntry('Stock Balance is required'),
      issuedQty: z.coerce.number({
        required_error: 'Field is required',
        invalid_type_error: 'Field must be a number',
      }),
      remarks: optionalStringSchemaEntry(),
    })
  ),
});

export const conversionSchema = z.object({
  conversionDate: z.coerce.date({
    required_error: 'Conversion date is required.',
  }),
  finalProduct: z.string().min(1, 'Select item converting to.'),
  convertedQty: z.coerce.number().min(1, 'Enter a valid quantity.'),
  convertingItems: z.array(
    z.object({
      id: z.string().min(1, 'ID is required.'),
      itemId: z.string().min(1, 'Item is required.'),
      stockBalance: z.coerce.number().optional(),
      convertingQty: z.coerce.number().min(1, 'Enter a valid quantity.'),
      remarks: z.string().optional(),
    })
  ),
});
