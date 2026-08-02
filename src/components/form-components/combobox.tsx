import type { Option } from "@/types/index.types";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldContext } from "@/lib/form";
import { cn } from "@/lib/utils";

type FormComboboxProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  helperText?: string;
  className?: string;
  fieldClassName?: string;
  disabled?: boolean;
  items: Array<Option>;
};

export function FormCombobox({
  label,
  required,
  placeholder,
  searchPlaceholder = "Search",
  emptyMessage = "No items found.",
  helperText,
  className,
  fieldClassName,
  disabled,
  items,
}: FormComboboxProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selected =
    items.find((item) => item.value === field.state.value) ?? null;

  return (
    <Field data-invalid={isInvalid} className={fieldClassName}>
      {(label || required) && (
        <FieldLabel htmlFor={field.name}>
          {label} {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}
      <Combobox
        items={items}
        value={selected}
        onValueChange={(value: Option | null) =>
          field.handleChange(value?.value ?? "")
        }
        itemToStringLabel={(item: Option) => item.label}
      >
        <ComboboxTrigger
          id={field.name}
          aria-invalid={isInvalid}
          onBlur={field.handleBlur}
          disabled={disabled}
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full min-w-0 justify-between font-normal h-10 border-input shadow-none",
                className,
              )}
            />
          }
        >
          <span className="min-w-0 flex-1 truncate text-left">
            <ComboboxValue placeholder={placeholder ?? "Select an option"} />
          </span>
        </ComboboxTrigger>
        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {helperText && <FieldDescription>{helperText}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
