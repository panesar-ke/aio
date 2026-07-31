import { formOptions } from "@tanstack/react-form";

import { dateFormat } from "@/lib/helpers/formatters";

import type { MaterialRequisitionFormValues } from "./procurement.types";

import { materialRequisitionFormSchema, productsSchema } from "./schemas";

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

export const productFormOpts = formOptions({
  validators: {
    onSubmit: productsSchema,
  },
});
