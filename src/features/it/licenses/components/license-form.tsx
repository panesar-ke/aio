'use client';
import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldDescription, FieldGroup, FieldSet } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { LICENSE_STATUS } from '@/drizzle/schema';
import {
  licenseFormSchemaValues,
  type LicenseFormSchemaValues,
} from '@/features/it/licenses/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { type Option } from '@/types/index.types';

import { upsertLicenseDetails } from '../services/actions';

type LicenseFormProps = {
  vendors: Array<Option>;
  initialValues?: LicenseFormSchemaValues;
};

export function LicenseForm({ vendors, initialValues }: LicenseFormProps) {
  const isEdit = Boolean(initialValues?.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    AppField,
    AppForm,
    SubmitButton,
    store,
    setFieldValue,
  } = useAppForm({
    defaultValues:
      initialValues ??
      ({
        name: '',
        softwareName: '',
        vendorId: '',
        licenseKey: '',
        licenseType: 'subscription',
        totalSeats: 1,
        usedSeats: 1,
        startDate: undefined,
        endDate: undefined,
        renewalDate: undefined,
        renewalCost: undefined,
        status: 'active',
        notes: '',
      } as LicenseFormSchemaValues),
    validators: {
      onSubmit: licenseFormSchemaValues,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertLicenseDetails(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} license`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} license. Please try again.`,
        onSuccess: () => {
          router.push('/it/licenses');
          queryClient.invalidateQueries({ queryKey: ['it-licenses'] });
        },
      });
    },
  });

  const [licenseType] = useStore(store, state => [state.values.licenseType]);

  useEffect(() => {
    if (licenseType === 'perpetual') {
      setFieldValue('endDate', undefined);
      setFieldValue('startDate', undefined);
      setFieldValue('renewalDate', undefined);
    }
  }, [licenseType, setFieldValue]);

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b">
        <CardTitle>{isEdit ? 'Edit License' : 'New License'}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Modify existing license information as needed.'
            : 'Add a new license with the required details.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldSet>
            <FieldDescription>License Information</FieldDescription>
            <FieldGroup className="grid md:grid-cols-2 gap-6">
              <AppField name="name">
                {field => (
                  <field.Input
                    placeholder="Google Workspace Business"
                    required
                    label="Name"
                  />
                )}
              </AppField>
              <AppField name="softwareName">
                {field => (
                  <field.Input
                    placeholder="Google Workspace Business"
                    required
                    label="Software Name"
                  />
                )}
              </AppField>
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
              <AppField name="licenseKey">
                {field => (
                  <field.Input
                    placeholder="[ENCRYPTION_KEY]"
                    label="License Key"
                  />
                )}
              </AppField>
              <AppField name="licenseType">
                {field => (
                  <field.Select
                    required
                    label="License Type"
                    placeholder="Select license type"
                  >
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="perpetual">Perpetual</SelectItem>
                  </field.Select>
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
                {field => (
                  <field.Input
                    type="date"
                    required={licenseType === 'subscription'}
                    disabled={licenseType === 'perpetual'}
                    label="Start Date"
                  />
                )}
              </AppField>
              <AppField name="endDate">
                {field => (
                  <field.Input
                    type="date"
                    required={licenseType === 'subscription'}
                    disabled={licenseType === 'perpetual'}
                    label="End Date"
                  />
                )}
              </AppField>
              <AppField name="renewalDate">
                {field => (
                  <field.Input
                    type="date"
                    required={licenseType === 'subscription'}
                    disabled={licenseType === 'perpetual'}
                    label="Renewal Date"
                  />
                )}
              </AppField>
              <AppField name="status">
                {field => (
                  <field.Select
                    required
                    label="Status"
                    placeholder="Select status"
                  >
                    {LICENSE_STATUS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.toUpperCase()}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
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
              <SubmitButton buttonText={isEdit ? 'Update Details' : 'Submit'} />
            </AppForm>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
