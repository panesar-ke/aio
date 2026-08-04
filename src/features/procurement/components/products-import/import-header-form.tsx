"use client";

import { useSelector } from "@tanstack/react-store";
import { useState } from "react";
import toast from "react-hot-toast";

import type { Option } from "@/types/index.types";

import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { queueProductImport } from "@/features/procurement/services/products-import/actions";
import { productImportHeaderSchema } from "@/features/procurement/utils/products-import/schemas";
import { useAppForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";

import { UploadDropzone } from "./upload-dropzone";

interface ImportHeaderFormProps {
  stores: Array<Option>;
  onQueued: () => void;
}

export function ImportHeaderForm({ stores, onQueued }: ImportHeaderFormProps) {
  const [file, setFile] = useState<File | null>(null);

  const form = useAppForm({
    defaultValues: { storeId: "", asOfDate: "" },
    validators: { onSubmit: productImportHeaderSchema },
    onSubmit: async ({ value }) => {
      if (!file) {
        toast.error("Please select a file to import.");
        return;
      }

      const formData = new FormData();
      formData.set("storeId", value.storeId);
      formData.set("asOfDate", value.asOfDate);
      formData.set("file", file);

      await handleSubmitFeedback({
        action: () => queueProductImport(formData),
        errorTitle: "Import failed to queue",
        successTitle: "Import queued",
        fallbackMessage: "Failed to queue the import. Please try again.",
        onSuccess: () => {
          setFile(null);
          onQueued();
        },
      });
    },
  });

  const [isSubmitting, storeId, asOfDate] = useSelector(form.store, (state) => [
    state.isSubmitting,
    state.values.storeId,
    state.values.asOfDate,
  ]);

  const isConfigured = Boolean(storeId && asOfDate);

  async function handleDownloadTemplate() {
    const response = await fetch(
      `/api/procurement/products/import/template?storeId=${storeId}`,
    );
    if (!response.ok) {
      toast.error("Failed to download template.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_import_template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded. Fill it in, then upload it below.");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <form.AppField name="storeId">
          {(field) => (
            <field.Select label="Store" placeholder="Select a store…">
              {stores.map((store) => (
                <SelectItem key={store.value} value={store.value}>
                  {store.label}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>
        <form.AppField name="asOfDate">
          {(field) => <field.Input label="Opening Balance Date" type="date" />}
        </form.AppField>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-card-foreground">Download Template</p>
        <Button
          type="button"
          variant="outline"
          disabled={!isConfigured}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-card-foreground">Upload Completed Template</p>
        <UploadDropzone
          disabled={!isConfigured}
          file={file}
          onFileSelected={setFile}
          onFileCleared={() => setFile(null)}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!isConfigured || !file || isSubmitting}>
            {isSubmitting ? "Validating…" : "Validate & Import"}
          </Button>
        </div>
      </div>
    </form>
  );
}
