"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import type {
  Service,
  ServiceFormValues,
} from "@/features/procurement/utils/procurement.types";

import { FormSectionHeader } from "@/components/custom/form-header";
import { useModal } from "@/features/integrations/modal-provider";
import { upsertService } from "@/features/procurement/services/services/actions";
import { serviceSchema } from "@/features/procurement/utils/schemas";
import { useAppForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";
import { cn } from "@/lib/utils";

export function ServiceForm({
  service,
  fromModal,
}: {
  service?: Service;
  fromModal?: boolean;
}) {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const router = useRouter();
  const isEdit = !!service?.id;

  const form = useAppForm({
    defaultValues:
      service ??
      ({
        serviceName: "",
        active: true,
        id: null,
      } as ServiceFormValues),
    validators: {
      onSubmit: serviceSchema,
    },

    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertService(value),
        errorTitle: `Error ${isEdit ? "updating" : "creating"} service`,
        successTitle: `✅ ${isEdit ? "Updated" : "Created"}`,
        fallbackMessage: `Failed to ${isEdit ? "update" : "create"} service. Please try again.`,
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["services"] });
          if (!fromModal) {
            router.push("/procurement/services");
          } else {
            setClose();
          }
        },
      });
    },
  });

  const isPending = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <div
      className={cn("", {
        "bg-card max-w-2xl shadow-sm rounded-lg border": !fromModal,
      })}
    >
      {!fromModal && (
        <FormSectionHeader
          title="Services"
          description="Enter the service details for this service."
        />
      )}
      <form
        className={cn("space-y-6", { "p-6": !fromModal })}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField name="serviceName">
          {(field) => (
            <field.Input
              required
              label="Service Name"
              placeholder="Enter service name"
            />
          )}
        </form.AppField>
        <form.AppField name="serviceFee">
          {(field) => (
            <field.Input type="number" label="Service Fee" placeholder="0.00" />
          )}
        </form.AppField>
        {service && (
          <form.AppField name="active">
            {(field) => (
              <field.Checkbox
                label="Active"
                helperText="Check if the service is active. Uncheck if the service is inactive."
              />
            )}
          </form.AppField>
        )}
        <form.AppForm>
          <form.SubmitButton
            buttonText={service ? "Update Service" : "Create Service"}
            icon={<SaveIcon />}
            isLoading={isPending}
            withReset
            onReset={() => {
              form.reset();
              if (fromModal) {
                setClose();
              }
            }}
          />
        </form.AppForm>
      </form>
    </div>
  );
}
