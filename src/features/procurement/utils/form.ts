import { formOptions } from "@tanstack/react-form";
import { materialRequisitionFormSchema } from "./schemas";
import { MaterialRequisitionFormValues } from "./procurement.types";
import { dateFormat } from "@/lib/helpers/formatters";

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
