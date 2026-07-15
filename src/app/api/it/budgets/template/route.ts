import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';

import { getBudgetLinesByFinancialYear } from '@/features/it/services/budgets/data';
import {
  getCategories,
  getSubCategories,
} from '@/features/it/services/expenses/data';
import {
  BUDGET_TEMPLATE_COLUMNS,
  BUDGET_TEMPLATE_DATA_START_ROW,
  BUDGET_TEMPLATE_HEADER_ROW,
  BUDGET_TEMPLATE_LOCKED_COLUMN_COUNT,
  BUDGET_TEMPLATE_TITLE_ROW,
} from '@/features/it/utils/budgets/excel-template';
import {
  getFinancialYearLabel,
  getFinancialYearMonths,
  getFinancialYearStart,
} from '@/lib/helpers/dates';
import { dateFormat } from '@/lib/helpers/formatters';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

const LOCKED_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFF3F4F6' },
};
const HEADER_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFE5E7EB' },
};

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'api' });

    const financialYearStartParam = request.nextUrl.searchParams.get(
      'financialYearStart',
    );
    const financialYearStart = financialYearStartParam
      ? Number(financialYearStartParam)
      : getFinancialYearStart();

    if (!Number.isInteger(financialYearStart)) {
      return NextResponse.json(
        { message: 'Invalid financial year' },
        { status: 422 },
      );
    }

    const [categories, subCategories, existingLines] = await Promise.all([
      getCategories(),
      getSubCategories(),
      getBudgetLinesByFinancialYear(financialYearStart),
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const months = getFinancialYearMonths(financialYearStart);
    const monthDates = months.map(month => dateFormat(month.date));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Budget');
    const lastColumn = BUDGET_TEMPLATE_COLUMNS.monthStart + months.length - 1;

    worksheet.mergeCells(
      BUDGET_TEMPLATE_TITLE_ROW,
      1,
      BUDGET_TEMPLATE_TITLE_ROW,
      lastColumn,
    );
    const titleCell = worksheet.getCell(BUDGET_TEMPLATE_TITLE_ROW, 1);
    titleCell.value = `IT Budget Template - FY ${getFinancialYearLabel(financialYearStart)}`;
    titleCell.font = { bold: true, size: 12 };

    const headerRow = worksheet.getRow(BUDGET_TEMPLATE_HEADER_ROW);
    headerRow.getCell(BUDGET_TEMPLATE_COLUMNS.subCategoryId).value =
      'Sub Category ID';
    headerRow.getCell(BUDGET_TEMPLATE_COLUMNS.category).value = 'Category';
    headerRow.getCell(BUDGET_TEMPLATE_COLUMNS.subCategory).value =
      'Sub Category';
    months.forEach((month, index) => {
      headerRow.getCell(BUDGET_TEMPLATE_COLUMNS.monthStart + index).value =
        month.label;
    });
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = HEADER_FILL;
      cell.protection = { locked: true };
    });

    const sortedSubCategories = [...subCategories].sort((a, b) => {
      const categoryCompare = (categoryMap.get(a.categoryId) ?? '').localeCompare(
        categoryMap.get(b.categoryId) ?? '',
      );
      return categoryCompare !== 0
        ? categoryCompare
        : a.name.localeCompare(b.name);
    });

    sortedSubCategories.forEach((subCategory, index) => {
      const row = worksheet.getRow(BUDGET_TEMPLATE_DATA_START_ROW + index);
      const existingAmounts = existingLines.get(subCategory.id);

      row.getCell(BUDGET_TEMPLATE_COLUMNS.subCategoryId).value =
        subCategory.id;
      row.getCell(BUDGET_TEMPLATE_COLUMNS.category).value =
        categoryMap.get(subCategory.categoryId) ?? '';
      row.getCell(BUDGET_TEMPLATE_COLUMNS.subCategory).value =
        subCategory.name;

      for (let col = 1; col <= BUDGET_TEMPLATE_LOCKED_COLUMN_COUNT; col++) {
        const cell = row.getCell(col);
        cell.protection = { locked: true };
        cell.fill = LOCKED_FILL;
      }

      monthDates.forEach((monthDate, monthIndex) => {
        const cell = row.getCell(
          BUDGET_TEMPLATE_COLUMNS.monthStart + monthIndex,
        );
        cell.value = existingAmounts?.get(monthDate) ?? 0;
        cell.numFmt = '#,##0.00';
        cell.protection = { locked: false };
      });
    });

    worksheet.getColumn(BUDGET_TEMPLATE_COLUMNS.subCategoryId).width = 14;
    worksheet.getColumn(BUDGET_TEMPLATE_COLUMNS.category).width = 22;
    worksheet.getColumn(BUDGET_TEMPLATE_COLUMNS.subCategory).width = 24;
    for (let col = BUDGET_TEMPLATE_COLUMNS.monthStart; col <= lastColumn; col++) {
      worksheet.getColumn(col).width = 12;
    }

    await worksheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="it-budget-template-${financialYearStart}.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.error(error);
    return NextResponse.json(
      { message: 'Failed to generate budget template' },
      { status: 500 },
    );
  }
}
