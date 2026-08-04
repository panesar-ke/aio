"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import type { Option } from "@/types/index.types";

import { ImportHeaderForm } from "./import-header-form";

export function ImportHeaderFormWrapper({ stores }: { stores: Array<Option> }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <ImportHeaderForm
      stores={stores}
      onQueued={() => {
        queryClient.invalidateQueries({ queryKey: ["products-import", "batches"] });
        router.refresh();
      }}
    />
  );
}
