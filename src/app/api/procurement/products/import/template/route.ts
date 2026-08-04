import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

import { IMPORT_TEMPLATE_HEADERS } from '@/features/procurement/services/products-import/constants';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET() {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    const headerRow = worksheet.addRow([...IMPORT_TEMPLATE_HEADERS]);
    headerRow.font = { bold: true };
    worksheet.addRow(['Example Product', 150, 25]);

    worksheet.getColumn(1).width = 32;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="products_import_template.xlsx"',
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
      { message: 'Failed to generate template' },
      { status: 500 },
    );
  }
}
