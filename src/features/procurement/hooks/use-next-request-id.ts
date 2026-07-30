import { useMemo, useRef } from "react";
import { createId } from "@paralleldrive/cuid2";
import type {
  MaterialRequisitionFormValues,
  Requisition,
} from "@/features/procurement/utils/procurement.types";

/**
 * Derives the initial requisition-line details for a form (from an existing
 * requisition when editing, or a single blank line when creating), and a
 * `getNextRequestId` generator that hands out locally-unique, monotonically
 * increasing request ids for lines added afterwards — without a server round-trip.
 */
export function useNextRequestId(
  requisitionNo: number,
  requisition?: Requisition,
) {
  const initialRequestId = useMemo(() => {
    const existingRequestIds =
      requisition?.mrqDetails
        .map((detail) => detail.requestId)
        .filter((requestId): requestId is number => requestId != null) ?? [];

    return Math.max(requisitionNo * 1000, ...existingRequestIds);
  }, [requisition, requisitionNo]);

  const defaultDetails = useMemo<MaterialRequisitionFormValues["details"]>(
    () => {
      if (requisition?.mrqDetails.length) {
        let nextRequestId = initialRequestId;

        return requisition.mrqDetails.map(
          ({ id, itemId, projectId, qty, remarks, requestId, serviceId }) => ({
            id: id.toString(),
            projectId,
            type: itemId ? ("item" as const) : ("service" as const),
            itemOrServiceId: itemId || serviceId || "",
            qty: Number(qty) || 0,
            remarks: remarks || "",
            requestId: requestId ?? nextRequestId++,
          }),
        );
      }

      return [
        {
          id: createId(),
          type: "item" as const,
          projectId: "",
          itemOrServiceId: "",
          qty: 0,
          remarks: "",
          requestId: initialRequestId,
        },
      ];
    },
    [initialRequestId, requisition],
  );

  const nextRequestIdRef = useRef<number | null>(null);
  if (nextRequestIdRef.current === null) {
    nextRequestIdRef.current =
      Math.max(
        ...defaultDetails.map((detail) => detail.requestId),
        initialRequestId,
      ) + 1;
  }

  const getNextRequestId = () => {
    const requestId = nextRequestIdRef.current!;
    nextRequestIdRef.current = requestId + 1;
    return requestId;
  };

  return { defaultDetails, getNextRequestId };
}
