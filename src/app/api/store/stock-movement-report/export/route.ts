import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';

import type { StockMovementReportRow } from '@/features/store/utils/store.types';

import { getStockMovementReport } from '@/features/store/services/reports/data';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';

const EXPORT_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['store:admin', 'store:standard'], {
      mode: 'api',
    });

    const params = request.nextUrl.searchParams;
    const storeId = params.get('storeId');
    const from = params.get('from');
    const to = params.get('to');
    const sortDir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';
    const search = params.get('search') || undefined;

    if (!storeId || !from || !to) {
      return NextResponse.json(
        { message: 'Invalid report parameters' },
        { status: 422 },
      );
    }

    const rows: Array<StockMovementReportRow> = [];
    let page = 1;
    let pageCount = 1;

    while (page <= pageCount) {
      const result = await getStockMovementReport({
        storeId,
        from,
        to,
        page,
        pageSize: EXPORT_PAGE_SIZE,
        sortDir,
        search,
      });

      if (result.error !== null || result.data === null) {
        return NextResponse.json(
          { message: result.error ?? 'Failed to generate report' },
          { status: 422 },
        );
      }

      rows.push(...result.data);
      pageCount = result.pageCount;
      page += 1;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Movements');
    worksheet.columns = [
      { header: 'Product', key: 'productName', width: 36 },
      { header: 'Opening Balance', key: 'openingBalance', width: 18 },
      { header: 'GRNs', key: 'grn', width: 14 },
      { header: 'Issues', key: 'issue', width: 14 },
      { header: 'Transfers Out', key: 'transferOut', width: 16 },
      { header: 'Transfers In', key: 'transferIn', width: 16 },
      { header: 'Conversion Out', key: 'conversionOut', width: 16 },
      { header: 'Conversion In', key: 'conversionIn', width: 16 },
      { header: 'Closing Balance', key: 'closingBalance', width: 18 },
    ];
    worksheet.addRows(
      rows.map(row => ({
        productName: row.productName.toUpperCase(),
        openingBalance: row.openingBalance,
        grn: row.grn,
        issue: row.issue,
        transferOut: row.transferOut,
        transferIn: row.transferIn,
        conversionOut: row.conversionOut,
        conversionIn: row.conversionIn,
        closingBalance: row.closingBalance,
      })),
    );

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = { from: 'A1', to: 'I1' };
    for (let column = 2; column <= 9; column += 1) {
      worksheet.getColumn(column).numFmt = '#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="stock-movements-${from}-to-${to}.xlsx"`,
        'Cache-Control': 'no-store',
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
      { message: 'Failed to export stock movement report' },
      { status: 500 },
    );
  }
}
