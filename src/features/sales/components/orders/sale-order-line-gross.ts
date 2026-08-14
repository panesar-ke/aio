type SaleOrderLineGrossInput = {
  qty?: number | string | null;
  rate?: number | string | null;
};

export function calculateSaleOrderLineGross({
  qty,
  rate,
}: SaleOrderLineGrossInput) {
  return (Number(qty) || 0) * (Number(rate) || 0);
}
