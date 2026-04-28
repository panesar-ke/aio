'use client';

import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import type { Option } from '@/types/index.types';

import { SelectItem } from '@/components/ui/select';
import { useModal } from '@/features/integrations/modal-provider';
import { assignAsset } from '@/features/it/assets/services/actions';
import {
  type AssignmentFormSchemaValues,
  assignmentFormSchemaValues,
} from '@/features/it/assets/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { dateFormat } from '@/lib/helpers/formatters';

type AssignmentFormProps = {
  users: Array<Option>;
  departments: Array<Option>;
  assets: Array<Option>;
  initialValues?: Partial<AssignmentFormSchemaValues>;
};

export function AssignmentForm({
  users,
  departments,
  assets,
  initialValues,
}: AssignmentFormProps) {
  const queryClient = useQueryClient();
  const { setClose } = useModal();

  const { handleSubmit, AppField, AppForm, SubmitButton, store } = useAppForm({
    defaultValues: {
      assetId: initialValues?.assetId ?? '',
      assetAssignmentCustodyType:
        initialValues?.assetAssignmentCustodyType ?? 'user',
      userId: initialValues?.userId ?? '',
      departmentId: initialValues?.departmentId ?? '',
      assignedDate: initialValues?.assignedDate ?? dateFormat(new Date()),
      assignmentNotes: initialValues?.assignmentNotes ?? '',
    } as AssignmentFormSchemaValues,
    validators: {
      onSubmit: assignmentFormSchemaValues,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => assignAsset(value),
        errorTitle: 'Error assigning asset',
        successTitle: '✅ Assignment Updated',
        fallbackMessage: 'Failed to assign asset. Please try again.',
        onSuccess: () => {
          setClose();
          queryClient.invalidateQueries({ queryKey: ['it-assets'] });
          queryClient.invalidateQueries({ queryKey: ['it-asset-assignments'] });
        },
      });
    },
  });

  const [custodyType] = useStore(store, state => [
    state.values.assetAssignmentCustodyType,
  ]);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }}
      className="space-y-6"
    >
      <AppField name="assetId">
        {field => (
          <field.Select required label="Asset" placeholder="Select asset">
            {assets.map(asset => (
              <SelectItem key={asset.value} value={asset.value}>
                {asset.label}
              </SelectItem>
            ))}
          </field.Select>
        )}
      </AppField>
      <AppField name="assetAssignmentCustodyType">
        {field => (
          <field.Select
            required
            label="Custody Type"
            placeholder="Select custody type"
          >
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="department">Department</SelectItem>
          </field.Select>
        )}
      </AppField>
      {custodyType === 'user' && (
        <AppField name="userId">
          {field => (
            <field.Select required label="Assign To" placeholder="Select user">
              {users.map(user => (
                <SelectItem key={user.value} value={user.value}>
                  {user.label}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </AppField>
      )}
      {custodyType === 'department' && (
        <AppField name="departmentId">
          {field => (
            <field.Select
              required
              label="Department"
              placeholder="Select department"
            >
              {departments.map(department => (
                <SelectItem key={department.value} value={department.value}>
                  {department.label}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </AppField>
      )}
      <AppField name="assignedDate">
        {field => <field.Input type="date" required label="Assigned Date" />}
      </AppField>
      <AppField name="assignmentNotes">
        {field => (
          <field.Textarea
            label="Notes"
            placeholder="Any handover notes or accessory details"
          />
        )}
      </AppField>
      <AppForm>
        <SubmitButton buttonText="Assign Asset" withReset className="w-full" />
      </AppForm>
    </form>
  );
}
