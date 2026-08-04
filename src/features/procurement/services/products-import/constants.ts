export const MAX_IMPORT_ROWS = 5000;

export const IMPORT_FILE_EXTENSION = '.xlsx';

export const IMPORT_FILE_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const DEFAULT_IMPORT_CATEGORY_ID = 1;
export const DEFAULT_IMPORT_CATEGORY_LABEL = 'Raw Material';

export const DEFAULT_IMPORT_UOM_ID = 4;
export const DEFAULT_IMPORT_UOM_LABEL = 'Pieces';

export const IMPORT_TEMPLATE_HEADERS = [
  'product_name',
  'price',
  'opening_qty',
] as const;

export const PRODUCTS_IMPORT_EVENT = 'products/import.requested' as const;
