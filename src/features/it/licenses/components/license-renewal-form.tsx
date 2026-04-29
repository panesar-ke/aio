import { useQueryClient } from '@tanstack/react-query';

import type { Option } from '@/types/index.types';

import { FieldDescription, FieldGroup, FieldSet } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { useModal } from '@/features/integrations/modal-provider';
import { renewLicense } from '@/features/it/licenses/services/actions';
import {
  licenseRenewalFormSchema,
  type LicenseRenewalFormSchemaValues,
} from '@/features/it/licenses/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function LicenseRenewalForm({
  licenseId,
  vendors,
}: {
  licenseId: string;
  vendors: Array<Option>;
}) {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const { handleSubmit, AppField, AppForm, SubmitButton } = useAppForm({
    defaultValues: {
      licenseId,
      vendorId: '',
      licenseKey: '',
      totalSeats: 1,
      usedSeats: 1,
      startDate: undefined,
      endDate: undefined,
      renewalDate: undefined,
      renewalCost: undefined,
      notes: '',
    } as LicenseRenewalFormSchemaValues,
    validators: {
      onSubmit: licenseRenewalFormSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => renewLicense(value),
        errorTitle: `Error creating license renewal`,
        successTitle: `✅ Created license renewal`,
        fallbackMessage: `Failed to create license renewal. Please try again.`,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['it-licenses'] });
          setClose();
        },
      });
    },
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6"
    >
      <FieldSet>
        <FieldDescription>License Renewal Information</FieldDescription>
        <FieldGroup className="grid md:grid-cols-2 gap-6">
          <AppField name="vendorId">
            {field => (
              <field.Select
                required
                label="Vendor"
                fieldClassName="col-span-full"
              >
                {vendors.map(vendor => (
                  <SelectItem key={vendor.value} value={vendor.value}>
                    {vendor.label.toUpperCase()}
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </AppField>
          <AppField name="renewalDate">
            {field => <field.Input type="date" required label="Renewal Date" />}
          </AppField>
          <AppField name="licenseKey">
            {field => (
              <field.Input
                placeholder="XXXX-XXXX-XXXX-XXXX"
                label="License Key"
              />
            )}
          </AppField>
          <AppField name="totalSeats">
            {field => (
              <field.Input
                type="number"
                placeholder="0"
                required
                label="Total Seats"
              />
            )}
          </AppField>
          <AppField name="usedSeats">
            {field => (
              <field.Input
                type="number"
                placeholder="0"
                required
                label="Used Seats"
              />
            )}
          </AppField>
          <AppField name="startDate">
            {field => <field.Input type="date" required label="Start Date" />}
          </AppField>
          <AppField name="endDate">
            {field => <field.Input type="date" required label="End Date" />}
          </AppField>
          <AppField name="notes">
            {field => (
              <field.Textarea
                placeholder="Notes"
                fieldClassName="col-span-full"
                className="shadow-none"
                label="Notes"
              />
            )}
          </AppField>
        </FieldGroup>
      </FieldSet>
      <FieldGroup>
        <AppForm>
          <SubmitButton buttonText="Renew License" />
        </AppForm>
      </FieldGroup>
    </form>
  );
}
