import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { revalidateTag } from "next/cache";

import db from "@/drizzle/db";
import {
  productImportBatches,
  productImportBatchRows,
  products,
  stockMovements,
} from "@/drizzle/schema";
import {
  DEFAULT_IMPORT_CATEGORY_ID,
  DEFAULT_IMPORT_UOM_ID,
  PRODUCTS_IMPORT_EVENT,
} from "@/features/procurement/services/products-import/constants";
import {
  getProductsGlobalTag,
  revalidateProductImportBatches,
} from "@/features/procurement/utils/cache";
import { productImportRowSchema } from "@/features/procurement/utils/products-import/schemas";
import { invalidateStockBalanceSnapshots } from "@/features/store/services/stock-balance/utils";
import { inngest } from "@/inngest/client";

interface ParsedRow {
  rowNumber: number;
  rawData: {
    product_name: string;
    price: number | null;
    opening_qty: number | null;
  };
  status: "success" | "error";
  errorMessage: string | null;
}

function parseCellNumber(value: ExcelJS.CellValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const raw =
    typeof value === "object" && value !== null && "result" in value
      ? (value as { result: unknown }).result
      : value;
  const num = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}

export const processProductImport = inngest.createFunction(
  { id: "process-product-import" },
  { event: PRODUCTS_IMPORT_EVENT },
  async ({ event, step }) => {
    const { batchId } = event.data;

    const batch = await step.run("load-batch", async () => {
      const record = await db.query.productImportBatches.findFirst({
        where: (model, { eq: eqOp }) => eqOp(model.id, batchId),
      });
      if (!record) throw new Error(`Import batch ${batchId} not found`);
      return record;
    });

    await step.run("mark-processing", async () => {
      await db
        .update(productImportBatches)
        .set({ status: "processing", startedAt: new Date() })
        .where(eq(productImportBatches.id, batchId));
    });

    const defaultsExist = await step.run("verify-defaults", async () => {
      const [category, uom] = await Promise.all([
        db.query.productCategories.findFirst({
          where: (model, { eq: eqOp }) =>
            eqOp(model.id, DEFAULT_IMPORT_CATEGORY_ID),
        }),
        db.query.uoms.findFirst({
          where: (model, { eq: eqOp }) => eqOp(model.id, DEFAULT_IMPORT_UOM_ID),
        }),
      ]);
      return Boolean(category) && Boolean(uom);
    });

    if (!defaultsExist) {
      await step.run("fail-missing-defaults", async () => {
        await db
          .update(productImportBatches)
          .set({
            status: "failed",
            completedAt: new Date(),
            failedRows: batch.totalRows,
          })
          .where(eq(productImportBatches.id, batchId));
        revalidateProductImportBatches(batchId);
      });
      return { batchId, status: "failed" as const };
    }

    const parsedRows = await step.run("parse-and-validate-rows", async () => {
      const workbook = new ExcelJS.Workbook();
      // exceljs's bundled .d.ts resolves `Buffer` against a different @types/node
      // shape than this file's ambient scope resolves it to (pre-existing multi-version
      // @types/node drift in node_modules, unrelated to this feature) — `as Buffer`
      // still fails because both sides are nominally distinct incompatible `Buffer`
      // declarations, so the escape has to go through `any`. Runtime value is a plain
      // Node.js Buffer either way.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(Buffer.from(batch.fileData, "base64") as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      const results: Array<ParsedRow> = [];
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const productNameValue = row.getCell(1).value;
        const priceValue = row.getCell(2).value;
        const qtyValue = row.getCell(3).value;

        const isBlankRow =
          (productNameValue === null || productNameValue === undefined) &&
          (priceValue === null || priceValue === undefined) &&
          (qtyValue === null || qtyValue === undefined);
        if (isBlankRow) continue;

        const rawData = {
          product_name: String(productNameValue ?? "").trim(),
          price: parseCellNumber(priceValue),
          opening_qty: parseCellNumber(qtyValue),
        };

        const parsed = productImportRowSchema.safeParse(rawData);
        results.push({
          rowNumber,
          rawData,
          status: parsed.success ? "success" : "error",
          errorMessage: parsed.success
            ? null
            : (parsed.error.issues[0]?.message ?? "Invalid row."),
        });
      }
      return results;
    });

    const insertResult = await step.run(
      "insert-products-and-movements",
      async () => {
        const validRows = parsedRows.filter((row) => row.status === "success");
        const createdProductIdsByRow = new Map<number, string>();

        await db.transaction(async (tx) => {
          for (const row of validRows) {
            const [{ id: productId }] = await tx
              .insert(products)
              .values({
                productName: row.rawData.product_name,
                categoryId: DEFAULT_IMPORT_CATEGORY_ID,
                uomId: DEFAULT_IMPORT_UOM_ID,
                buyingPrice:
                  row.rawData.price !== null
                    ? row.rawData.price.toString()
                    : null,
                active: false,
                stockItem: true,
                isPeace: false,
                excludeFromAutoDeactivation: false,
              })
              .returning({ id: products.id });

            createdProductIdsByRow.set(row.rowNumber, productId);
          }

          if (createdProductIdsByRow.size > 0) {
            const movements = validRows.map((row) => {
              const productId = createdProductIdsByRow.get(row.rowNumber);
              if (!productId)
                throw new Error(
                  `Missing created product for row ${row.rowNumber}`,
                );
              return {
                transactionDate: batch.asOfDate,
                itemId: productId,
                qty: String(row.rawData.opening_qty ?? 0),
                transactionType: "OPENING_BAL" as const,
                transactionId: productId,
                createdBy: batch.uploadedBy,
                storeId: batch.storeId,
              };
            });

            await tx.insert(stockMovements).values(movements);
            await invalidateStockBalanceSnapshots(tx, movements);
          }

          if (parsedRows.length > 0) {
            await tx.insert(productImportBatchRows).values(
              parsedRows.map((row) => ({
                batchId,
                rowNumber: row.rowNumber,
                rawData: row.rawData,
                status: row.status,
                errorMessage: row.errorMessage,
                productId: createdProductIdsByRow.get(row.rowNumber) ?? null,
              })),
            );
          }
        });

        return {
          successCount: createdProductIdsByRow.size,
          failedCount: parsedRows.length - createdProductIdsByRow.size,
        };
      },
    );

    const finalStatus = await step.run("finalize-batch", async () => {
      const { successCount, failedCount } = insertResult;
      const status =
        successCount === 0
          ? ("failed" as const)
          : failedCount === 0
            ? ("completed" as const)
            : ("completed_with_errors" as const);

      await db
        .update(productImportBatches)
        .set({
          status,
          successRows: successCount,
          failedRows: failedCount,
          completedAt: new Date(),
        })
        .where(eq(productImportBatches.id, batchId));

      revalidateProductImportBatches(batchId);
      revalidateTag(getProductsGlobalTag(), "max");
      revalidateTag("stock-balance", "max");
      return status;
    });

    return { batchId, status: finalStatus };
  },
);
