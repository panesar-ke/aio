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
    // zod v4 types z.coerce.* input as `unknown`, which no longer structurally matches
    // TanStack Form's FormValidateOrFn<TParentData> against this schema's Standard Schema
    // input type. Runtime validation is unaffected; this is a compile-time-only cast.
    validators: {
      onSubmit: materialRequisitionFormSchema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
};

export const productFormOpts = formOptions({
  validators: {
    onSubmit: productsSchema,
  },
});
