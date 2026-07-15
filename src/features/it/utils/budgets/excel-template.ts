// Shared column/row layout for the budget Excel template, used by both the
// template generator (download) and the import parser (upload) so they stay
// in sync.
export const BUDGET_TEMPLATE_TITLE_ROW = 1;
export const BUDGET_TEMPLATE_HEADER_ROW = 2;
export const BUDGET_TEMPLATE_DATA_START_ROW = 3;

export const BUDGET_TEMPLATE_COLUMNS = {
  subCategoryId: 1,
  category: 2,
  subCategory: 3,
  monthStart: 4,
} as const;

export const BUDGET_TEMPLATE_LOCKED_COLUMN_COUNT = 3;
