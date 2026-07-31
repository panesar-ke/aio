"use server";
import { createId } from "@paralleldrive/cuid2";
import { type AxiosResponse, isAxiosError } from "axios";
import { eq, inArray, max, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import db from "@/drizzle/db";
import { mrqDetails, mrqHeaders } from "@/drizzle/schema";
import {
  getRequisition,
  getRequisitionNo,
} from "@/features/procurement/services/material-requisitions/data";
import {
  getMaterialRequisitionNoGlobalTag,
  revalidateMaterialRequisitions,
} from "@/features/procurement/utils/cache";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import axios from "@/lib/axios";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { getCurrentUser } from "@/lib/session";
import { apiErrorHandler } from "@/lib/utils";

import { materialRequisitionFormSchema } from "../../utils/schemas";

const REQUEST_ID_ADVISORY_LOCK = 90210;

function omitFormId(
  detail: {
    id: string;
  } & Omit<typeof mrqDetails.$inferInsert, "requestId">,
) {
  return {
    headerId: detail.headerId,
    itemId: detail.itemId,
    projectId: detail.projectId,
    qty: detail.qty,
    remarks: detail.remarks,
    serviceId: detail.serviceId,
    unitId: detail.unitId,
  };
}

async function assignRequestIds(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  details: Array<Omit<typeof mrqDetails.$inferInsert, "requestId">>,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(${REQUEST_ID_ADVISORY_LOCK})`,
  );

  const [requestIdState] = await tx
    .select({ maxRequestId: max(mrqDetails.requestId) })
    .from(mrqDetails);

  let nextRequestId = Number(requestIdState?.maxRequestId ?? 0) + 1;

  return details.map((detail) => ({
    ...detail,
    requestId: nextRequestId++,
  }));
}

export const createRequisition = async (values: unknown) =>
  runAction("create-requisition", async () => {
    await requireAnyPermission(["procurement:admin", "procurement:standard"]);
    const data = parseOrFail(materialRequisitionFormSchema, values);

    let reference: string;

    const documentNo = data.id
      ? (await getRequisition(data.id))?.id
      : await getRequisitionNo();
    if (!documentNo)
      return {
        error: true,
        message: "Unable to generate document number",
      };

    try {
      reference = await db.transaction(async (tx) => {
        const { details, documentDate } = data;
        const user = await getCurrentUser();

        const formattedDetails = details.map((detail) => ({
          id: detail.id,
          headerId: documentNo,
          projectId: detail.projectId,
          itemId: detail.type === "item" ? detail.itemOrServiceId : null,
          serviceId: detail.type === "service" ? detail.itemOrServiceId : null,
          qty: detail.qty.toString(),
          unitId: 1,
          remarks: detail.remarks || null,
        }));

        const ref = await tx
          .insert(mrqHeaders)
          .values({
            id: documentNo,
            reference: createId(),
            documentDate: new Date(documentDate).toISOString(),
            createdBy: user.id,
          })
          .onConflictDoUpdate({
            target: mrqHeaders.id,
            set: {
              documentDate: new Date(documentDate).toISOString(),
              fileUrl: null,
            },
          })
          .returning({ reference: mrqHeaders.reference });

        if (data.id) {
          const existingDetails = await tx
            .select({
              id: mrqDetails.id,
              requestId: mrqDetails.requestId,
            })
            .from(mrqDetails)
            .where(eq(mrqDetails.headerId, documentNo));

          const existingDetailIds = new Set(
            existingDetails.map((detail) => detail.id),
          );
          const persistedDetails = formattedDetails.filter((detail) =>
            existingDetailIds.has(detail.id),
          );
          const newDetails = formattedDetails.filter(
            (detail) => !existingDetailIds.has(detail.id),
          );

          const removeIds = existingDetails
            .filter(
              (detail) =>
                !formattedDetails.some(
                  (submittedDetail) => submittedDetail.id === detail.id,
                ),
            )
            .map((detail) => detail.id);

          if (removeIds.length > 0) {
            await tx
              .delete(mrqDetails)
              .where(inArray(mrqDetails.id, removeIds));
          }

          if (newDetails.length > 0) {
            await tx
              .insert(mrqDetails)
              .values(await assignRequestIds(tx, newDetails.map(omitFormId)));
          }

          await Promise.all(
            persistedDetails.map(({ id, ...detail }) =>
              tx
                .update(mrqDetails)
                .set({
                  qty: detail.qty.toString(),
                  itemId: detail.itemId,
                  remarks: detail.remarks,
                  serviceId: detail.serviceId,
                  projectId: detail.projectId,
                })
                .where(eq(mrqDetails.id, id)),
            ),
          );
        } else {
          await tx
            .insert(mrqDetails)
            .values(
              await assignRequestIds(tx, formattedDetails.map(omitFormId)),
            );
        }

        return ref[0].reference;
      });

      revalidateMaterialRequisitions(reference);
      revalidateTag(getMaterialRequisitionNoGlobalTag(), "max");

      return {
        error: false,
        message: data.id
          ? "Requisition updated successfully"
          : "Requisition created successfully",
        data: reference,
      };
    } catch (e) {
      console.error(e);
      return {
        error: true,
        message: "Unable to create requisition",
      };
    }
  });

type ActionState = {
  success: boolean;
  error: string | null;
  fileUrl: string | null;
};

export async function generateRequisitionAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const requisitionId = formData.get("requisitionId") as string;

    const requisition = await getRequisition(requisitionId);

    if (!requisition) {
      return {
        success: false,
        error: "Requisition not found",
        fileUrl: null,
      };
    }

    if (!requisitionId) {
      return {
        success: false,
        error: "Requisition ID is required",
        fileUrl: null,
      };
    }

    const formattedData = {
      documentDate: requisition.documentDate,
      requisitionNumber: requisition.id.toString(),
      items: requisition.mrqDetails.map(
        ({ product, service, project, itemId, qty }) => ({
          itemName: itemId
            ? (product?.productName ?? "")
            : (service?.serviceName ?? ""),
          quantity: qty,
          unit: itemId ? (product?.uom?.abbreviation ?? "DEF") : "DEF",
          rate: itemId
            ? (product?.buyingPrice ?? 0)
            : (service?.serviceFee ?? 0),
          project: project.projectName,
        }),
      ),
    };

    const res: AxiosResponse<{
      success: boolean;
      message: string;
      url: string;
    }> = await axios.post(`/generate-requisition`, formattedData);

    await db
      .update(mrqHeaders)
      .set({ fileUrl: res.data.url })
      .where(eq(mrqHeaders.reference, requisitionId));

    revalidateMaterialRequisitions(requisitionId);
    revalidateTag(getMaterialRequisitionNoGlobalTag(), "max");

    return {
      success: true,
      error: null,
      fileUrl: res.data.url,
    };
  } catch (error) {
    console.error("Error generating requisition:", error);
    if (isAxiosError(error)) {
      const errMessage = apiErrorHandler(error);
      return {
        success: false,
        error: errMessage,
        fileUrl: null,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate requisition",
      fileUrl: null,
    };
  }
}

export const deleteRequisition = async (requisitionId: string) => {
  const requisition = await getRequisition(requisitionId);
  if (!requisition) {
    return {
      error: true,
      message: "Requisition not found",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(mrqDetails)
        .where(eq(mrqDetails.headerId, requisition.id));
      await tx
        .delete(mrqHeaders)
        .where(eq(mrqHeaders.reference, requisitionId));
    });

    revalidateMaterialRequisitions(requisitionId);
    revalidateTag(getMaterialRequisitionNoGlobalTag(), "max");
  } catch (error) {
    console.error("Error deleting requisition:", error);
    return {
      error: true,
      message: "Failed to delete requisition",
    };
  }
  return redirect("/procurement/material-requisition");
};
