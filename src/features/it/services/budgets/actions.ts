"use server";

import { eq, sql } from "drizzle-orm";
import ExcelJS from "exceljs";

import db from "@/drizzle/db";
import { itBudgetLines, itBudgets } from "@/drizzle/schema";
import {
  BUDGET_TEMPLATE_COLUMNS,
  BUDGET_TEMPLATE_DATA_START_ROW,
} from "@/features/it/utils/budgets/excel-template";
import {
  budgetFormSchemaValues,
  budgetImportRowSchema,
} from "@/features/it/utils/budgets/schemas";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import { getFinancialYearMonths } from "@/lib/helpers/dates";
import { dateFormat } from "@/lib/helpers/formatters";
import {
  requireAnyPermission,
  requirePermission,
} from "@/lib/permissions/guards";
import { getCurrentUserOrNull } from "@/lib/session";

type BudgetUpsertInput = {
  financialYearStart: number;
  subCategoryId: string;
  months: Array<{ monthDate: string; amount: number }>;
};

async function upsertBudgetRecord(data: BudgetUpsertInput, createdBy?: string) {
  return db.transaction(async (tx) => {
    const [{ id: budgetId }] = await tx
      .insert(itBudgets)
      .values({
        financialYearStart: data.financialYearStart,
        subCategoryId: data.subCategoryId,
        createdBy,
      })
      .onConflictDoUpdate({
        target: [itBudgets.financialYearStart, itBudgets.subCategoryId],
        set: { updatedAt: new Date() },
      })
      .returning({ id: itBudgets.id });

    await tx
      .insert(itBudgetLines)
      .values(
        data.months.map((month) => ({
          budgetId,
          monthDate: month.monthDate,
          amount: month.amount.toString(),
        })),
      )
      .onConflictDoUpdate({
        target: [itBudgetLines.budgetId, itBudgetLines.monthDate],
        set: { amount: sql`excluded.amount`, updatedAt: new Date() },
      });

    return budgetId;
  });
}

export const upsertBudget = async (values: unknown) =>
  runAction("upsert budget", async () => {
    await requireAnyPermission(["it:admin", "it:standard"]);

    const data = parseOrFail(budgetFormSchemaValues, values);
    const user = await getCurrentUserOrNull();

    const id = await upsertBudgetRecord(data, user?.id);

    return {
      error: false,
      message: `Budget ${data.id ? "updated" : "created"} successfully.`,
      data: { id },
    };
  });

export const deleteBudget = async (id: string) =>
  runAction("delete budget", async () => {
    await requirePermission("it:admin");

    const budget = await db.query.itBudgets.findFirst({
      columns: { id: true },
      where: (model, { eq }) => eq(model.id, id),
    });

    if (!budget) {
      return { error: true, message: "Budget not found." };
    }

    await db.delete(itBudgets).where(eq(itBudgets.id, id));

    return { error: false, message: "Budget deleted successfully." };
  });

export type ImportBudgetsFailure = {
  row: number;
  subCategory: string;
  reason: string;
};

export type ImportBudgetsState = {
  error: string | null;
  summary: {
    created: number;
    updated: number;
    failed: Array<ImportBudgetsFailure>;
  } | null;
};

function toAmount(value: ExcelJS.CellValue): number | null {
  const raw =
    typeof value === "object" && value !== null && "result" in value
      ? (value as { result: unknown }).result
      : value;
  const num = typeof raw === "number" ? raw : Number(raw);

  return Number.isFinite(num) ? num : null;
}

function toText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  return String(value).trim();
}

export async function importBudgetsFromExcel(
  _prevState: ImportBudgetsState,
  formData: FormData,
): Promise<ImportBudgetsState> {
  try {
    await requirePermission("it:admin");

    const file = formData.get("file");
    // const financialYearStart = Number(formData.get('financialYearStart'));
    const financialYearStartRaw = formData.get("financialYearStart");
    const financialYearStart =
      typeof financialYearStartRaw === "string" &&
      financialYearStartRaw.trim() !== ""
        ? Number(financialYearStartRaw)
        : NaN;

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Please select a file to import.", summary: null };
    }

    if (!Number.isInteger(financialYearStart)) {
      return { error: "A financial year is required.", summary: null };
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return { error: "The uploaded file has no worksheet.", summary: null };
    }

    const monthDates = getFinancialYearMonths(financialYearStart).map((month) =>
      dateFormat(month.date),
    );

    const subCategories = await db.query.itSubCategories.findMany({
      with: { itCategory: true },
    });
    const subCategoryMap = new Map(
      subCategories.map((subCategory) => [subCategory.id, subCategory]),
    );

    const existingBudgets = await db.query.itBudgets.findMany({
      where: (model, { eq }) =>
        eq(model.financialYearStart, financialYearStart),
      columns: { subCategoryId: true },
    });
    const existingSubCategoryIds = new Set(
      existingBudgets.map((budget) => budget.subCategoryId),
    );

    const failed: Array<ImportBudgetsFailure> = [];
    let created = 0;
    let updated = 0;
    const user = await getCurrentUserOrNull();

    for (
      let rowNumber = BUDGET_TEMPLATE_DATA_START_ROW;
      rowNumber <= worksheet.rowCount;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);
      const subCategoryId = toText(
        row.getCell(BUDGET_TEMPLATE_COLUMNS.subCategoryId).value,
      );

      if (!subCategoryId) continue;

      const subCategory = subCategoryMap.get(subCategoryId);
      const fail = (reason: string) =>
        failed.push({
          row: rowNumber,
          subCategory: toText(
            row.getCell(BUDGET_TEMPLATE_COLUMNS.subCategory).value,
          ),
          reason,
        });

      if (!subCategory) {
        fail("Unknown sub-category ID — the template may have been altered.");
        continue;
      }

      const categoryLabel = toText(
        row.getCell(BUDGET_TEMPLATE_COLUMNS.category).value,
      );
      const subCategoryLabel = toText(
        row.getCell(BUDGET_TEMPLATE_COLUMNS.subCategory).value,
      );

      if (
        categoryLabel.toLowerCase() !==
          subCategory.itCategory.name.toLowerCase() ||
        subCategoryLabel.toLowerCase() !== subCategory.name.toLowerCase()
      ) {
        fail(
          "Sub-category details do not match our records — the template may have been altered.",
        );
        continue;
      }

      const months = Array.from({ length: 12 }, (_, index) =>
        toAmount(row.getCell(BUDGET_TEMPLATE_COLUMNS.monthStart + index).value),
      );

      if (months.some((amount) => amount === null || amount < 0)) {
        fail("Month amounts must be non-negative numbers.");
        continue;
      }

      const result = budgetImportRowSchema.safeParse({
        subCategoryId,
        months,
      });

      if (!result.success) {
        fail(result.error.issues[0]?.message ?? "Invalid row.");
        continue;
      }

      try {
        await upsertBudgetRecord(
          {
            financialYearStart,
            subCategoryId,
            months: result.data.months.map((amount, index) => ({
              monthDate: monthDates[index],
              amount,
            })),
          },
          user?.id,
        );

        if (existingSubCategoryIds.has(subCategoryId)) {
          updated++;
        } else {
          created++;
        }
      } catch (error) {
        console.error("Error upserting budget row:", error);
        fail("Failed to save this row. Please try again.");
      }
    }

    return { error: null, summary: { created, updated, failed } };
  } catch (error) {
    console.error("Error importing budgets:", error);
    return {
      error: "Failed to import budgets. Please try again.",
      summary: null,
    };
  }
}
