import { formOptions } from "@tanstack/react-form";

import { dateFormat } from "@/lib/helpers/formatters";

import type {
  MaterialRequisitionFormValues,
  OrderFormInput,
} from "./procurement.types";

import {
  materialRequisitionFormSchema,
  orderSchema,
  productsSchema,
} from "./schemas";

export const materialRequisitionFormOpts = (
  requisitionNumber?: number,
  requisition?: MaterialRequisitionFormValues,
) => {
  return formOptions({
    defaultValues: requisition ?? {
      details: [],
      documentDate: dateFormat(new Date()),
      documentNo: requisitionNumber,
    },
    validators: {
      onSubmit: materialRequisitionFormSchema,
    },
  });
};

export const purchaseOrderFormOpts = (
  orderNumber?: number,
  order?: OrderFormInput,
) => {
  return formOptions({
    defaultValues:
      order ??
      ({
        documentNo: orderNumber,
        documentDate: dateFormat(new Date()),
        vendor: "",
        invoiceNo: "",
        invoiceDate: "",
        vatType: "NONE",
        vat: "",
        details: [],
      } satisfies OrderFormInput),
    validators: {
      onSubmit: orderSchema,
    },
  });
};

export const productFormOpts = formOptions({
  validators: {
    onSubmit: productsSchema,
  },
});
