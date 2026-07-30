import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormCheckbox } from "@/components/form-components/checkbox";
import { FormCombobox } from "@/components/form-components/combobox";
import { FormSelect } from "@/components/form-components/select";
import { SubmitButton } from "@/components/form-components/submit-button";
import { TextAreaField } from "@/components/form-components/textarea";
import { TextField } from "@/components/form-components/textfield";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    Input: TextField,
    Textarea: TextAreaField,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    Combobox: FormCombobox,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
