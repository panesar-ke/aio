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
      requestId: z.number({
        error: (issue) =>
          issue.input === undefined ? "Request ID is required" : undefined,
      }),
    }),
  ),
});

export const orderSchema = z
  .object({
    documentNo: z.number().min(1, "Document number must be at least 1"), //TODO: REPLACE WITH A ZOD NUMBER HELPER
    documentDate: z.iso.date({
      error: (issue) =>
        issue.input === undefined ? "Select a date" : "Invalid date provided",
    }), //TODO: REPLACE WITH A ZOD NUMBER HELPER
    vendor: requiredStringSchemaEntry("Vendor is required"),
    invoiceNo: optionalStringSchemaEntry(),
    vatType: z.enum(["NONE", "INCLUSIVE", "EXCLUSIVE"], {
      error: (issue) => (issue.input === undefined ? "Select vat" : undefined),
    }),
    vat: optionalStringSchemaEntry(),
    invoiceDate: z.iso.date().optional(), //TODO: REPLACE WITH A ZOD NUMBER HELPER
    details: z.array(
      z
        .object({
          id: requiredStringSchemaEntry("ID is required"),
          type: z.enum(["item", "service"]),
          itemOrServiceId: requiredStringSchemaEntry("Field is required"),
          requestId: requiredStringSchemaEntry("Request ID is required"),
          projectId: requiredStringSchemaEntry("Project is required"),
          qty: z.coerce.number<number>({ error: () => "Qty is required" }), //TODO: REPLACE WITH A ZOD NUMBER HELPER
          rate: z.coerce.number<number>({ error: () => "Rate is required" }), //TODO: REPLACE WITH A ZOD NUMBER HELPER
          discountType: z.enum(["NONE", "PERCENTAGE", "AMOUNT"]).optional(),
          discount: z.coerce.number<number>().optional(), //TODO: REPLACE WITH A ZOD NUMBER HELPER
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
  id: nullableTrimmedString,
  serviceName: requiredTrimmedStringSchemaEntry("Service name is required"),
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
      error: (issue) =>
        issue.input === undefined ? "Select report type" : undefined,
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
      error: (issue) =>
        issue.input === undefined ? "Select report criteria" : undefined,
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
      error: (issue) =>
        issue.input === undefined ? "Select report criteria" : undefined,
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
