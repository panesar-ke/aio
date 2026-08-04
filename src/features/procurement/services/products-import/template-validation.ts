import type ExcelJS from 'exceljs';

import { IMPORT_TEMPLATE_HEADERS } from '@/features/procurement/services/products-import/constants';

export function readWorksheetHeaders(worksheet: ExcelJS.Worksheet): Array<string> {
  const headerRow = worksheet.getRow(1);
  return IMPORT_TEMPLATE_HEADERS.map((_, index) =>
    String(headerRow.getCell(index + 1).value ?? '')
      .trim()
      .toLowerCase(),
  );
}

export function headersMatchTemplate(headers: Array<string>): boolean {
  return IMPORT_TEMPLATE_HEADERS.every(
    (expected, index) => headers[index]?.trim().toLowerCase() === expected,
  );
}
