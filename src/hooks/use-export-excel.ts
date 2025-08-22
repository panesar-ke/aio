import { download, generateCsv, mkConfig } from 'export-to-csv';

export function useExportExcel(fileName?: string) {
  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
    filename: fileName || 'data.csv',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleExport(data: Array<any>) {
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  }

  return handleExport;
}
