import { createId } from "@paralleldrive/cuid2";
import { useMemo } from "react";

import type {
  MaterialRequisitionFormValues,
  Requisition,
} from "@/features/procurement/utils/procurement.types";

/**
 * Derives the initial requisition-line details for a form (from an existing
 * requisition when editing, or a single blank line when creating).
 * Persisted `requestId` values are assigned server-side.
 */
export function buildDefaultDetails(
  requisition?: Requisition,
): MaterialRequisitionFormValues["details"] {
  if (requisition?.mrqDetails.length) {
    return requisition.mrqDetails.map(
      ({ id, itemId, projectId, qty, remarks, requestId, serviceId }) => ({
        id: id.toString(),
        projectId,
        type: itemId ? ("item" as const) : ("service" as const),
        itemOrServiceId: itemId || serviceId || "",
        qty: Number(qty) || 0,
        remarks: remarks || "",
        requestId: requestId ?? -1,
      }),
    );
  }

  return [
    {
      id: createId(),
      type: "item" as const,
      projectId: "",
      itemOrServiceId: "",
      qty: 1,
      remarks: "",
      requestId: -1,
    },
  ];
}

export function getNextTemporaryRequestId(
  details: MaterialRequisitionFormValues["details"],
) {
  return (
    Math.min(
      0,
      ...details.map((detail) =>
        detail.requestId < 0 ? detail.requestId : 0,
      ),
    ) - 1
  );
}

export function useNextRequestId(requisition?: Requisition) {
  const defaultDetails = useMemo(
    () => buildDefaultDetails(requisition),
    [requisition],
  );

  return { defaultDetails };
}
