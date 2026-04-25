type FinancialYearRange = {
  currentYear: { from: Date; to: Date };
  previousYear: { from: Date; to: Date };
};

export function getFinancialYearRanges(date?: Date): FinancialYearRange {
  const ref = date ?? new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();

  const fyStartYear = month >= 6 ? year : year - 1;

  const currentYearFrom = new Date(fyStartYear, 6, 1);
  const currentYearTo = ref;

  const previousYearFrom = new Date(fyStartYear - 1, 6, 1);
  const previousYearTo = new Date(fyStartYear, 5, 30);

  return {
    currentYear: { from: currentYearFrom, to: currentYearTo },
    previousYear: { from: previousYearFrom, to: previousYearTo },
  };
}
