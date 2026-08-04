"use client";

import { useQuery } from "@tanstack/react-query";

export interface ImportBatchListItem {
  id: string;
  fileName: string;
  storeName: string;
  asOfDate: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  totalRows: number;
  successRows: number;
  failedRows: number;
  uploadedByName: string;
  createdAt: string;
}

interface ImportBatchesResponse {
  batches: Array<ImportBatchListItem>;
}

const ACTIVE_STATUSES = new Set(["queued", "processing"]);

export function useImportBatches(initialData: Array<ImportBatchListItem>) {
  return useQuery<ImportBatchesResponse>({
    queryKey: ["products-import", "batches"],
    queryFn: async () => {
      const res = await fetch("/api/procurement/products/import/batches");
      if (!res.ok) {
        throw new Error("Failed to fetch import batches");
      }
      return res.json();
    },
    initialData: { batches: initialData },
    refetchInterval: (query) => {
      const batches = query.state.data?.batches ?? [];
      const hasActive = batches.some((batch) => ACTIVE_STATUSES.has(batch.status));
      return hasActive ? 4000 : false;
    },
  });
}
