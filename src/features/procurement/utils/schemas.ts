import z from 'zod';
import {
  optionalNumberSchemaEntry,
  optionalStringSchemaEntry,
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules';
import { addDays } from 'date-fns';
import { isValidEmail } from '@/lib/utils';

export const materialRequisitionFormSchema = z.object({
  documentNo: requiredNumberSchemaEntry('Document No is required'),
  documentDate: requiredDateSchemaEntry(),
  details: z.array(
    z.object({
      id: requiredStringSchemaEntry('ID is required'),
      projectId: requiredStringSchemaEntry('Project is required'),
      type: z.enum(['item', 'service']),
      itemOrServiceId: requiredStringSchemaEntry('Field is required'),
      qty: requiredNumberSchemaEntry('Qty is required'),
      remarks: optionalStringSchemaEntry(),
      requestId: requiredNumberSchemaEntry('Request ID is required'),
    })
  ),
});

export const orderSchema = z
  .object({
    documentNo: requiredNumberSchemaEntry('Document no is required.'),
    documentDate: requiredDateSchemaEntry(),
    vendor: requiredStringSchemaEntry('Vendor is required'),
    invoiceNo: optionalStringSchemaEntry(),
    vatType: z.enum(['NONE', 'INCLUSIVE', 'EXCLUSIVE'], {
      required_error: 'Select vat',
    }),
    vat: optionalStringSchemaEntry(),
    invoiceDate: z.coerce.date().optional(),
    displayOdometerDetails: z.boolean(),
    vehicle: z.coerce.number().optional(),
    details: z.array(
      z
        .object({
          id: requiredStringSchemaEntry('ID is required'),
          type: z.enum(['item', 'service']),
          itemOrServiceId: requiredStringSchemaEntry('Field is required'),
          requestId: requiredStringSchemaEntry('Request ID is required'),
          projectId: requiredStringSchemaEntry('Project is required'),
          qty: requiredNumberSchemaEntry('Qty is required'),
          rate: optionalNumberSchemaEntry(),
          discountType: z.enum(['NONE', 'PERCENTAGE', 'AMOUNT']).optional(),
          discount: optionalNumberSchemaEntry(),
        })
        .superRefine(({ discount, discountType }, ctx) => {
          if (discountType !== 'NONE' && !discount) {
            ctx.addIssue({
              code: 'custom',
              path: ['discount'],
              message: 'Discount is required when discount type is not NONE',
            });
          }
        })
    ),
  })
  .superRefine(({ vat, vatType }, ctx) => {
    if (vatType !== 'NONE' && !vat) {
      ctx.addIssue({
        code: 'custom',
        path: ['vat'],
        message: 'VAT is required',
      });
    }
  });

export const vendorSchema = z.object({
  vendorName: requiredStringSchemaEntry('Vendor name is required.'),
  contact: z
    .string()
    .min(10, 'Invalid contact provided.')
    .max(15, 'Contact cannot be over 15 characters'),
  address: optionalStringSchemaEntry(),
  kraPin: optionalStringSchemaEntry(),
  email: optionalStringSchemaEntry().refine(val => !val || isValidEmail(val), {
    message: 'Invalid email address provided.',
  }),
  contactPerson: requiredStringSchemaEntry(
    'Name of contact person is required.'
  ),
  active: z.boolean().optional(),
});

export const productsSchema = z.object({
  productName: requiredStringSchemaEntry('Product name is required.'),
  categoryId: requiredStringSchemaEntry('Select product category.'),
  uomId: requiredStringSchemaEntry('Select product unit of measure.'),
  buyingPrice: optionalStringSchemaEntry(),
  stockItem: z.boolean(),
  subItem: z.boolean(),
  active: z.boolean(),
  openingBalance: optionalNumberSchemaEntry(),
});

export const serviceSchema = z.object({
  serviceName: requiredStringSchemaEntry('Service name is required'),
  serviceFee: optionalNumberSchemaEntry(),
  active: z.boolean(),
});

export const autoOrdersSchema = z.object({
  items: z.array(
    z.object({
      id: requiredStringSchemaEntry('ID is required'),
      productId: requiredStringSchemaEntry('Product is required'),
      vendorId: requiredStringSchemaEntry('Vendor is required'),
      reorderLevel: requiredNumberSchemaEntry('Reorder level is required'),
      reorderQty: requiredNumberSchemaEntry('Reorder quantity is required'),
    })
  ),
});

export const orderRegisterSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    reportType: z.enum(['summary', 'items'], {
      required_error: 'Select report type',
    }),
    vendorId: requiredStringSchemaEntry('Vendor is required'),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'To date must be later than from date',
      });
    }
  });

export const orderByCriteriaSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    criteria: z.enum(['project', 'product', 'service'], {
      required_error: 'Select report criteria',
    }),
    option: requiredStringSchemaEntry('Product/Project/Service is required'),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'To date must be later than from date',
      });
    }
  });

export const topVendorsSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    criteria: z.enum(['discount', 'value'], {
      required_error: 'Select report criteria',
    }),
    top: requiredStringSchemaEntry('Top N is required'),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'To date must be later than from date',
      });
    }
  });

export const projectFormSchema = z.object({
  projectName: requiredStringSchemaEntry('Project name is required.'),
  active: z.boolean().optional(),
});
