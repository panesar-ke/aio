import { download, generateCsv, mkConfig } from 'export-to-csv';

export function useExportExcel(fileName?: string) {
  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
    filename: fileName || 'data.csv',
  });

  function handleExport(data: Array<any>) {
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  }

  return handleExport;
}
