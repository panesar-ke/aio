'use client';

import { useQueryClient } from '@tanstack/react-query';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { Option } from '@/types/index.types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { upsertAsset } from '@/features/it/assets/services/actions';
import {
  assetConditionValues,
  type AssetFormSchemaValues,
  assetFormSchemaValues,
  assetStatusValues,
} from '@/features/it/assets/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { dateFormat, reportCaseFormatter } from '@/lib/helpers/formatters';

type AssetFormProps = {
  categories: Array<{ id: string; name: string }>;
  vendors: Array<Option>;
  departments: Array<Option>;
  initialValues?: AssetFormSchemaValues;
};

export function AssetForm({
  categories,
  vendors,
  departments,
  initialValues,
}: AssetFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEdit = Boolean(initialValues?.id);

  const { handleSubmit, AppField, AppForm, SubmitButton } = useAppForm({
    defaultValues:
      initialValues ??
      ({
        categoryId: '',
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        specs: '',
        purchaseDate: dateFormat(new Date()),
        purchaseCost: 0,
        vendorId: '',
        warrantyExpiryDate: '',
        status: 'in_stock',
        condition: 'new',
        departmentId: '',
        notes: '',
      } as AssetFormSchemaValues),
    validators: {
      onSubmit: assetFormSchemaValues,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertAsset(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} asset`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} asset. Please try again.`,
        onSuccess: () => {
          router.push('/it/assets/registry');
          queryClient.invalidateQueries({ queryKey: ['it-assets'] });
        },
      });
    },
  });

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b">
        <CardTitle>{isEdit ? 'Edit Asset' : 'New Asset'}</CardTitle>
        <CardDescription>
          Fill in the details below to {isEdit ? 'update this ' : 'create an '}
          asset registry record.
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
            <FieldLegend>Core Details</FieldLegend>
            <FieldGroup className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppField name="name">
                {field => (
                  <field.Input
                    required
                    label="Asset Name"
                    fieldClassName="col-span-2"
                    placeholder="e.g. Lenovo ThinkPad T14"
                  />
                )}
              </AppField>
              <AppField name="categoryId">
                {field => (
                  <field.Select
                    required
                    label="Category"
                    placeholder="Select category"
                  >
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="condition">
                {field => (
                  <field.Select required label="Condition">
                    {assetConditionValues.map(condition => (
                      <SelectItem key={condition} value={condition}>
                        {reportCaseFormatter(condition)}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="status">
                {field => (
                  <field.Select required label="Status">
                    {assetStatusValues.map(status => (
                      <SelectItem key={status} value={status}>
                        {reportCaseFormatter(status)}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="serialNumber">
                {field => (
                  <field.Input
                    label="Serial Number"
                    placeholder="e.g. SN12345"
                  />
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend>Purchase & Ownership</FieldLegend>
            <FieldGroup className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppField name="brand">
                {field => (
                  <field.Input label="Brand" placeholder="e.g. Lenovo" />
                )}
              </AppField>
              <AppField name="model">
                {field => (
                  <field.Input label="Model" placeholder="e.g. T14 Gen 5" />
                )}
              </AppField>
              <AppField name="purchaseDate">
                {field => <field.Input type="date" label="Purchase Date" />}
              </AppField>
              <AppField name="purchaseCost">
                {field => (
                  <field.Input
                    type="number"
                    label="Purchase Cost"
                    placeholder="0.00"
                  />
                )}
              </AppField>
              <AppField name="vendorId">
                {field => (
                  <field.Select label="Vendor" placeholder="Select vendor">
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.value} value={vendor.value}>
                        {vendor.label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="departmentId">
                {field => (
                  <field.Select
                    label="Department"
                    placeholder="Select department"
                  >
                    {departments.map(department => (
                      <SelectItem
                        key={department.value}
                        value={department.value}
                      >
                        {department.label.toUpperCase()}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </AppField>
              <AppField name="warrantyExpiryDate">
                {field => (
                  <field.Input type="date" label="Warranty Expiry Date" />
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend>Technical Details</FieldLegend>
            <FieldGroup className="space-y-6">
              <AppField name="specs">
                {field => (
                  <field.Textarea
                    label="Specs (JSON)"
                    placeholder='e.g. {"ram":"16GB","storage":"512GB SSD"}'
                  />
                )}
              </AppField>
              <AppField name="notes">
                {field => (
                  <field.Textarea
                    label="Notes"
                    placeholder="General notes, condition remarks, or accessories"
                  />
                )}
              </AppField>
            </FieldGroup>
          </FieldSet>
          <AppForm>
            <SubmitButton
              icon={<SaveIcon />}
              withReset
              buttonText={isEdit ? 'Update Asset' : 'Create Asset'}
            />
          </AppForm>
        </form>
      </CardContent>
    </Card>
  );
}
