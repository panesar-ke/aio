import z from "zod";

import {
  nullableNonNegativeNumberField,
  nullableTrimmedString,
  optionalNumberSchemaEntry,
  optionalStringSchemaEntry,
  optionalTrimmedString,
  requiredDateSchemaEntry,
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from "@/lib/schema-rules";
import { isValidEmail } from "@/lib/utils";

export const materialRequisitionFormSchema = z.object({
  id: z.string().trim().optional().nullable(),
  documentNo: requiredNumberSchemaEntry("Document No is required"),
  documentDate: requiredDateSchemaEntry(),
  details: z.array(
    z.object({
      id: requiredStringSchemaEntry("ID is required"),
      projectId: requiredStringSchemaEntry("Project is required"),
      type: z.enum(["item", "service"]),
      itemOrServiceId: requiredStringSchemaEntry("Field is required"),
      qty: requiredNumberSchemaEntry("Qty is required"),
      remarks: optionalStringSchemaEntry(),
      requestId: z.number({ required_error: "Request ID is required" }),
    }),
  ),
});

export const orderSchema = z
  .object({
    documentNo: requiredNumberSchemaEntry("Document no is required."),
    documentDate: requiredDateSchemaEntry(),
    vendor: requiredStringSchemaEntry("Vendor is required"),
    invoiceNo: optionalStringSchemaEntry(),
    vatType: z.enum(["NONE", "INCLUSIVE", "EXCLUSIVE"], {
      required_error: "Select vat",
    }),
    vat: optionalStringSchemaEntry(),
    invoiceDate: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.date().optional(),
    ),
    details: z.array(
      z
        .object({
          id: requiredStringSchemaEntry("ID is required"),
          type: z.enum(["item", "service"]),
          itemOrServiceId: requiredStringSchemaEntry("Field is required"),
          requestId: requiredStringSchemaEntry("Request ID is required"),
          projectId: requiredStringSchemaEntry("Project is required"),
          qty: z.coerce.number({
            required_error: "Qty is required",
            invalid_type_error: "Qty is required",
          }),
          rate: optionalNumberSchemaEntry(),
          discountType: z.enum(["NONE", "PERCENTAGE", "AMOUNT"]).optional(),
          discount: optionalNumberSchemaEntry(),
        })
        .superRefine(({ discount, discountType }, ctx) => {
          if (discountType !== "NONE" && !discount) {
            ctx.addIssue({
              code: "custom",
              path: ["discount"],
              message: "Discount is required when discount type is not NONE",
            });
          }
        }),
    ),
  })
  .superRefine(({ vat, vatType }, ctx) => {
    if (vatType !== "NONE" && !vat) {
      ctx.addIssue({
        code: "custom",
        path: ["vat"],
        message: "VAT is required",
      });
    }
  });

export const vendorSchema = z.object({
  id: nullableTrimmedString,
  vendorName: requiredTrimmedStringSchemaEntry("Vendor name is required."),
  contact: z
    .string()
    .trim()
    .min(10, "Invalid contact provided.")
    .max(15, "Contact cannot be over 15 characters"),
  address: optionalTrimmedString,
  kraPin: optionalTrimmedString.refine(
    (val) => !val || /^[A-P][0-9]{9}[A-Z]$/.test(val.trim()),
    {
      message: "Invalid KRA PIN provided.",
    },
  ),
  email: optionalTrimmedString.refine((val) => !val || isValidEmail(val), {
    message: "Invalid email address provided.",
  }),
  contactPerson: requiredTrimmedStringSchemaEntry(
    "Name of contact person is required.",
  ),
  active: z.boolean(),
});

export const productsSchema = z.object({
  id: nullableTrimmedString,
  productName: requiredStringSchemaEntry("Product name is required."),
  categoryId: requiredStringSchemaEntry("Select product category."),
  uomId: requiredStringSchemaEntry("Select product unit of measure."),
  buyingPrice: nullableNonNegativeNumberField("Buying price"),
  stockItem: z.boolean(),
  subItem: z.boolean(),
  active: z.boolean(),
  openingBalance: nullableNonNegativeNumberField("Opening Balance"),
  excludeFromAutoDeactivation: z.boolean(),
});

export const serviceSchema = z.object({
  serviceName: requiredStringSchemaEntry("Service name is required"),
  serviceFee: optionalNumberSchemaEntry(),
  active: z.boolean(),
});

export const autoOrdersSchema = z.object({
  items: z.array(
    z.object({
      id: requiredStringSchemaEntry("ID is required"),
      productId: requiredStringSchemaEntry("Product is required"),
      vendorId: requiredStringSchemaEntry("Vendor is required"),
      reorderLevel: requiredNumberSchemaEntry("Reorder level is required"),
      reorderQty: requiredNumberSchemaEntry("Reorder quantity is required"),
    }),
  ),
});

export const orderRegisterSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    reportType: z.enum(["summary", "items"], {
      required_error: "Select report type",
    }),
    vendorId: requiredStringSchemaEntry("Vendor is required"),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "To date must be later than from date",
      });
    }
  });

export const orderByCriteriaSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    criteria: z.enum(["project", "product", "service"], {
      required_error: "Select report criteria",
    }),
    option: requiredStringSchemaEntry("Product/Project/Service is required"),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "To date must be later than from date",
      });
    }
  });

export const topVendorsSchema = z
  .object({
    from: requiredStringSchemaEntry(),
    to: requiredStringSchemaEntry(),
    criteria: z.enum(["discount", "value"], {
      required_error: "Select report criteria",
    }),
    top: requiredStringSchemaEntry("Top N is required"),
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "To date must be later than from date",
      });
    }
  });

export const projectFormSchema = z.object({
  projectName: requiredStringSchemaEntry("Project name is required."),
  active: z.boolean().optional(),
});
