import type { Metadata } from "next";

import { ImportHeaderFormWrapper } from "@/features/procurement/components/products-import/import-header-form-wrapper";
import { ImportInstructionsPanel } from "@/features/procurement/components/products-import/import-instructions-panel";
import { RecentImportsTable } from "@/features/procurement/components/products-import/recent-imports-table";
import { getRecentImportBatches } from "@/features/procurement/services/products-import/data";
import { getStores } from "@/features/store/services/stores/data";

export const metadata: Metadata = { title: "Product Import" };

export default async function ProductImportPage() {
  const [stores, rawBatches] = await Promise.all([getStores(), getRecentImportBatches()]);

  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.storeName.toUpperCase(),
  }));

  // `createdAt` comes back as a real `Date` from Drizzle. React Server Component →
  // Client Component props preserve Date instances as-is (no JSON serialization), but
  // useImportBatches' polling path goes through `fetch().json()`, which turns it into
  // an ISO string. Normalize here so `ImportBatchListItem.createdAt` is always a string,
  // matching both the initial SSR data and every subsequent poll.
  const batches = rawBatches.map((batch) => ({
    ...batch,
    createdAt: batch.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk-load products and opening stock balances for a store using the standard Excel
          template.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ImportHeaderFormWrapper stores={storeOptions} />
        </div>
        <div className="lg:col-span-2">
          <ImportInstructionsPanel />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Imports</h2>
        <RecentImportsTable initialData={batches} />
      </div>
    </div>
  );
}
