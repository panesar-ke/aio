"use client";

import type { DragEvent } from "react";

import { UploadCloudIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IMPORT_FILE_EXTENSION } from "@/features/procurement/services/products-import/constants";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  disabled?: boolean;
  file: File | null;
  onFileSelected: (file: File) => void;
  onFileCleared: () => void;
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function UploadDropzone({
  disabled,
  file,
  onFileSelected,
  onFileCleared,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith(IMPORT_FILE_EXTENSION)) {
      onFileSelected(dropped);
    }
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove selected file"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onFileCleared();
          }}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={disabled ? undefined : handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors",
        !disabled && "hover:border-primary/40 hover:bg-muted/60",
        disabled && "cursor-not-allowed opacity-50",
        isDragOver && "border-primary bg-muted",
      )}
    >
      <UploadCloudIcon className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          or click to browse — {IMPORT_FILE_EXTENSION} files only
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_FILE_EXTENSION}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
    </div>
  );
}
