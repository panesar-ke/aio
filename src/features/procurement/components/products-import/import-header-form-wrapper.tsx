"use client";

import { useRouter } from "next/navigation";

import type { Option } from "@/types/index.types";

import { ImportHeaderForm } from "./import-header-form";

export function ImportHeaderFormWrapper({ stores }: { stores: Array<Option> }) {
  const router = useRouter();
  return <ImportHeaderForm stores={stores} onQueued={() => router.refresh()} />;
}
