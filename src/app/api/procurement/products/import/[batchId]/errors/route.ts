import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';

import {
  getImportBatch,
  getImportBatchErrorRows,
} from '@/features/procurement/services/products-import/data';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireAnyPermission(
      ['procurement:admin', 'procurement:standard', 'store:admin', 'store:standard'],
      { mode: 'api' },
    );

    const { batchId } = await params;
    const batch = await getImportBatch(batchId);
    if (!batch) {
      return NextResponse.json({ message: 'Import batch not found' }, { status: 404 });
    }

    const errorRows = await getImportBatchErrorRows(batchId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Errors');
    worksheet.addRow(['row_number', 'product_name', 'price', 'opening_qty', 'error']).font = {
      bold: true,
    };

    for (const row of errorRows) {
      const rawData = row.rawData as {
        product_name: string;
        price: number | null;
        opening_qty: number | null;
      };
      worksheet.addRow([
        row.rowNumber,
        rawData.product_name,
        rawData.price,
        rawData.opening_qty,
        row.errorMessage,
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${batch.fileName.replace(/\.xlsx$/i, '')}-errors.xlsx"`,
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
    return NextResponse.json({ message: 'Failed to generate error report' }, { status: 500 });
  }
}
