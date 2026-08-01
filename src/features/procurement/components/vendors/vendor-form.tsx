"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useRouter } from "next/navigation";

import type {
  Vendor,
  VendorFormValues,
} from "@/features/procurement/utils/procurement.types";

import FormHeader, { FormSectionHeader } from "@/components/custom/form-header";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { useModal } from "@/features/integrations/modal-provider";
import { vendorSchema } from "@/features/procurement/utils/schemas";
import { useAppForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";
import { cn } from "@/lib/utils";

import { upsertVendor } from "../../services/vendors/actions";

interface VendorFormProps {
  vendor?: Vendor;
  fromModal?: boolean;
}

export function VendorForm({ vendor, fromModal }: VendorFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setClose } = useModal();
  const isEdit = !!vendor;
  const defaultValues: VendorFormValues = {
    id: vendor?.id ?? null,
    vendorName: vendor?.vendorName ?? "",
    contactPerson: vendor?.contactPerson ?? "",
    contact: vendor?.contact ?? "",
    address: vendor?.address,
    email: vendor?.email,
    kraPin: vendor?.kraPin,
    active: vendor?.active ?? true,
  };
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: vendorSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertVendor(value),
        errorTitle: `Error ${isEdit ? "updating" : "creating"} vendor`,
        successTitle: `✅ ${isEdit ? "Updated" : "Created"}`,
        fallbackMessage: `Failed to ${isEdit ? "update" : "create"} vendor. Please try again.`,
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["vendors"] });
          if (!fromModal) {
            router.push("/procurement/vendors");
          } else {
            setClose();
          }
        },
      });
    },
  });

  const [isPending, errors] = useSelector(form.store, (state) => [
    state.isSubmitting,
    state.errors,
  ]);
  console.log({ errors });

  return (
    <>
      {!fromModal && (
        <FormHeader
          title={isEdit ? "Edit Vendor" : "Create Vendor"}
          description={
            isEdit
              ? "Update vendor information and save your changes."
              : "Fill in the details below to create vendor"
          }
        />
      )}
      <div
        className={cn({
          "bg-card border rounded-lg shadow-sm max-w-3xl mt-6": !fromModal,
        })}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className={cn({ "space-y-4": fromModal })}
        >
          <FieldSet>
            {!fromModal && (
              <FormSectionHeader
                title="Vendor Details"
                description="Information about this vendor!"
              />
            )}
            <FieldGroup
              className={cn("grid md:grid-cols-2 gap-6", {
                "p-6 pt-0": !fromModal,
              })}
            >
              <form.AppField name="vendorName">
                {(field) => (
                  <field.Input
                    fieldClassName="col-span-full"
                    label="Vendor Name"
                    placeholder="Example: Eastleigh Wholesalers"
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="contactPerson">
                {(field) => (
                  <field.Input
                    label="Contact Person"
                    placeholder="Example: John Doe"
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="contact">
                {(field) => (
                  <field.Input
                    label="Contact"
                    placeholder="Example: 0700000000"
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.Input
                    type="email"
                    label="Email"
                    placeholder="Example: example@company.com"
                  />
                )}
              </form.AppField>
              <form.AppField name="kraPin">
                {(field) => (
                  <field.Input
                    label="Tax PIN"
                    maxLength={11}
                    placeholder="Example: A123456789B"
                  />
                )}
              </form.AppField>
              <form.AppField name="address">
                {(field) => (
                  <field.Input
                    placeholder="Enter vendor address..."
                    fieldClassName="col-span-full"
                    label="Address"
                  />
                )}
              </form.AppField>
              {isEdit && (
                <form.AppField name="active">
                  {(field) => (
                    <field.Checkbox
                      label="Active"
                      helperText="Inactive vendors are hidden from purchase orders."
                    />
                  )}
                </form.AppField>
              )}
            </FieldGroup>
          </FieldSet>
          <FieldGroup className={cn({ "pb-4 pr-6": !fromModal })}>
            <form.AppForm>
              <form.SubmitButton
                isLoading={isPending}
                buttonText={isEdit ? "Update Vendor" : "Create Vendor"}
              />
            </form.AppForm>
          </FieldGroup>
        </form>
      </div>
    </>
  );
}
