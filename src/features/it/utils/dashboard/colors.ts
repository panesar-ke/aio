const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/**
 * Stable color for a category at a given position in a deterministically
 * sorted list (e.g. alphabetical), so the same category keeps the same
 * color across the By Category chart and Budget Tracker.
 */
export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length] as string;
}
