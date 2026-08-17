"use server";

import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { revalidateTag } from "next/cache";

import db from "@/drizzle/db";
import { productImportBatches } from "@/drizzle/schema";
import {
  IMPORT_FILE_EXTENSION,
  IMPORT_TEMPLATE_HEADERS,
  MAX_IMPORT_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
} from "@/features/procurement/services/products-import/constants";
import {
  headersMatchTemplate,
  readWorksheetHeaders,
} from "@/features/procurement/services/products-import/template-validation";
import {
  getProductsGlobalTag,
  revalidateProductImportBatches,
} from "@/features/procurement/utils/cache";
import { productImportHeaderSchema } from "@/features/procurement/utils/products-import/schemas";
import { inngest } from "@/inngest/client";
import { productsImportRequestedEvent } from "@/inngest/events";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { getCurrentUser } from "@/lib/session";

const IMPORT_ACTION_PERMISSIONS = [
  "procurement:admin",
  "procurement:standard",
  "store:admin",
  "store:standard",
] as const;

export const queueProductImport = async (formData: FormData) =>
  runAction("queueProductImport", async () => {
    await requireAnyPermission([...IMPORT_ACTION_PERMISSIONS]);

    const header = parseOrFail(productImportHeaderSchema, {
      storeId: formData.get("storeId"),
      asOfDate: formData.get("asOfDate"),
    });

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: true, message: "Please select a file to import." };
    }

    if (!file.name.toLowerCase().endsWith(IMPORT_FILE_EXTENSION)) {
      return { error: true, message: "Only .xlsx files are accepted." };
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      return {
        error: true,
        message: `File exceeds the maximum size of ${MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      return {
        error: true,
        message: "The uploaded file is not a valid .xlsx workbook.",
      };
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { error: true, message: "The uploaded file has no worksheet." };
    }

    if (!headersMatchTemplate(readWorksheetHeaders(worksheet))) {
      return {
        error: true,
        message: `Headers must exactly match the template: ${IMPORT_TEMPLATE_HEADERS.join(", ")}.`,
      };
    }

    const rowCount = worksheet.rowCount - 1;
    if (rowCount <= 0) {
      return { error: true, message: "The uploaded file has no data rows." };
    }
    if (rowCount > MAX_IMPORT_ROWS) {
      return {
        error: true,
        message: `File contains ${rowCount} rows, exceeding the ${MAX_IMPORT_ROWS} row limit.`,
      };
    }

    const user = await getCurrentUser("action");
    const fileData = Buffer.from(arrayBuffer).toString("base64");

    const [{ id: batchId }] = await db
      .insert(productImportBatches)
      .values({
        storeId: header.storeId,
        asOfDate: header.asOfDate,
        uploadedBy: user.id,
        fileName: file.name,
        fileData,
        status: "queued",
        totalRows: rowCount,
      })
      .returning({ id: productImportBatches.id });

    try {
      await inngest.send(productsImportRequestedEvent.create({ batchId }));
    } catch (error) {
      console.error("Error dispatching product import event:", error);
      await db
        .update(productImportBatches)
        .set({
          status: "failed",
          completedAt: new Date(),
          failedRows: rowCount,
        })
        .where(eq(productImportBatches.id, batchId));

      revalidateProductImportBatches(batchId);

      return {
        error: true,
        message: "Failed to queue the import. Please try again.",
      };
    }

    revalidateProductImportBatches(batchId);
    revalidateTag(getProductsGlobalTag(), "max");
    revalidateTag("stock-balance", "max");

    return {
      error: false,
      message: "Import queued. You will be notified when it completes.",
      data: { batchId },
    };
  });
