import ExcelJS from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getEmployeesForExport } from '@/features/human-resources/services/employees/data';
import {
  EXPORT_COLUMN_KEYS,
  EXPORT_COLUMNS,
  type ExportColumnKey,
  isSensitiveColumn,
} from '@/features/human-resources/utils/employees/export-columns';
import { getNairobiToday } from '@/features/human-resources/utils/employees/tenure';
import { titleCase } from '@/lib/helpers/formatters';
import { ForbiddenError, UnauthorizedError } from '@/lib/permissions/errors';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';

const bodySchema = z.object({
  ids: z.array(z.number().int()).min(1).max(5000),
  columns: z.array(z.enum(EXPORT_COLUMN_KEYS as [ExportColumnKey, ...Array<ExportColumnKey>])).min(1),
});

const enumText = (value: string | null | undefined) =>
  value ? titleCase(value.replace(/-/g, ' ')) : '';

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'api' });

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid export request' }, { status: 422 });
    }

    const canSeeSensitive = await hasPermission('hr:admin');
    const columns = [...new Set(parsed.data.columns)].filter(
      key => canSeeSensitive || !isSensitiveColumn(key),
    );
    if (columns.length === 0) {
      return NextResponse.json({ message: 'No exportable columns selected' }, { status: 403 });
    }

    const records = await getEmployeesForExport(parsed.data.ids);

    const values: Record<ExportColumnKey, (r: (typeof records)[number]) => string | number | null> = {
      employeeNo: r => r.id,
      payrollNo: r => r.payrollNo ?? '',
      fullName: r => `${r.otherNames} ${r.surname}`.replace(/\s+/g, ' ').trim(),
      gender: r => enumText(r.gender),
      maritalStatus: r => enumText(r.maritalStatus),
      nationality: r => r.nationality ?? '',
      educationLevel: r => enumText(r.educationLevel),
      idNo: r => r.idNo ?? '',
      dob: r => r.dob,
      department: r => r.department,
      designation: r => r.designation,
      employmentType: r => enumText(r.employmentType),
      category: r => enumText(r.category),
      status: r => enumText(r.status),
      joiningDate: r => r.joiningDate ?? '',
      contractDate: r => r.contractDate ?? '',
      contractDuration: r => (r.contractDuration > 0 ? r.contractDuration : ''),
      expiryDate: r => r.expiryDate ?? '',
      kraPin: r => r.kraPin ?? '',
      nssf: r => r.nssf ?? '',
      shaNo: r => r.shaNo ?? '',
      nhif: r => r.nhif ?? '',
      bankName: r => r.bankName ?? '',
      branchName: r => r.branchName ?? '',
      accountNo: r => r.accountNo ?? '',
      accountName: r => r.accountName ?? '',
    };

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employees');
    sheet.columns = columns.map(key => ({
      header: EXPORT_COLUMNS[key].label,
      key,
      width: EXPORT_COLUMNS[key].width,
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    for (const record of records) {
      sheet.addRow(Object.fromEntries(columns.map(key => [key, values[key](record)])));
    }
    for (const key of ['idNo', 'accountNo', 'kraPin', 'nssf', 'shaNo', 'nhif', 'payrollNo'] as const) {
      if (columns.includes(key)) sheet.getColumn(key).numFmt = '@';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="employees_${getNairobiToday()}.xlsx"`,
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
    return NextResponse.json({ message: 'Failed to export employees' }, { status: 500 });
  }
}
