import {
  DEFAULT_IMPORT_CATEGORY_LABEL,
  DEFAULT_IMPORT_UOM_LABEL,
  IMPORT_FILE_EXTENSION,
  MAX_IMPORT_ROWS,
} from "@/features/procurement/services/products-import/constants";

const STEPS = [
  "Choose the store and the opening balance date.",
  "Download the template.",
  "Fill in product_name, price (optional), and opening_qty for each new product.",
  "Upload the completed file — the system validates before saving anything.",
  "Review any errors, fix them in the file, and re-upload if needed.",
];

const COLUMNS = [
  { name: "product_name", note: "Required. Every row creates a brand-new product." },
  { name: "price", note: "Optional. Maps to the product's buying price." },
  { name: "opening_qty", note: "Required. Quantity on hand on the as-of date. Must be ≥ 0." },
];

const RULES = [
  "Do not modify the header row or column order.",
  `Every imported product is created with a default category ("${DEFAULT_IMPORT_CATEGORY_LABEL}") and unit of measure ("${DEFAULT_IMPORT_UOM_LABEL}") — correct these manually after import.`,
  "Imported products land inactive until reviewed and activated manually.",
  "opening_qty must be a positive number or zero — no negative values.",
  `Max ${MAX_IMPORT_ROWS.toLocaleString()} rows per upload. Split into multiple files for larger sets.`,
  `Accepted format: ${IMPORT_FILE_EXTENSION} only.`,
];

export function ImportInstructionsPanel() {
  return (
    <aside className="space-y-5">
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">How This Works</h2>
        </div>
        <ol className="divide-y">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 px-5 py-3.5 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-tertiary-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Template Column Guide</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-4 py-2.5 font-semibold">Column</th>
              <th className="px-4 py-2.5 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {COLUMNS.map((column) => (
              <tr key={column.name}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">{column.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{column.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Rules &amp; Limits</h2>
        </div>
        <ul className="space-y-3 px-5 py-4 text-sm">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
