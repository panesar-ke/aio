'use client';
import { useEffect, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { CopyIcon, ShieldCheckIcon } from 'lucide-react';
import type { Form as FormType, Option } from '@/types/index.types';
import type {
  CloneUserRightsFormValues,
  UserRightsFormValue,
} from '@/features/admin/utils/admin.types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  cloneUserRightsFormSchema,
  userRightsFormSchema,
} from '@/features/admin/utils/schema';
import { SearchSelect } from '@/components/custom/search-select';
import { userRightsQueryOptions } from '@/features/admin/services/query-options';
import {
  cloneUserRights,
  updateUserRights,
} from '@/features/admin/services/action';
import { ToastContent } from '@/components/custom/toast';
import { ButtonLoader } from '@/components/custom/loaders';
import { useModal } from '@/features/integrations/modal-provider';
import CustomModal from '@/components/custom/custom-modal';
import { FormActions } from '@/components/custom/form-actions';

interface Props {
  users: Array<Option>;
  forms: Array<FormType>;
}

export function RightsForm({ forms, users }: Props) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const form = useForm<UserRightsFormValue>({
    defaultValues: {
      userId: '',
      rights: forms.map(f => ({
        formId: f.id,
        hasAccess: false,
      })),
    },
    resolver: zodResolver(userRightsFormSchema),
  });

  const selectedUserId = useWatch({
    control: form.control,
    name: 'userId',
  });

  const { data: userRightsData, isLoading: isLoadingRights } = useQuery(
    userRightsQueryOptions(selectedUserId || '')
  );

  useEffect(() => {
    if (selectedUserId && userRightsData) {
      const userFormIds = new Set(userRightsData.map(r => r.formId));
      const updatedRights = forms.map(f => ({
        formId: f.id,
        hasAccess: userFormIds.has(f.id),
      }));
      form.setValue('rights', updatedRights);
    } else if (!selectedUserId) {
      const resetRights = forms.map(f => ({
        formId: f.id,
        hasAccess: false,
      }));
      form.setValue('rights', resetRights);
    }
  }, [selectedUserId, userRightsData, forms, form]);

  const handleCheckboxChange = (formId: number, checked: boolean) => {
    const currentRights = form.getValues('rights');
    const updatedRights = currentRights.map(right =>
      right.formId === formId ? { ...right, hasAccess: checked } : right
    );
    form.setValue('rights', updatedRights);
  };

  const handleSelectAll = (checked: boolean) => {
    const updatedRights = forms.map(f => ({
      formId: f.id,
      hasAccess: checked,
    }));
    form.setValue('rights', updatedRights);
  };

  const currentRights = useWatch({
    control: form.control,
    name: 'rights',
  });

  const isAllSelected = currentRights?.every(right => right.hasAccess) || false;

  const onSubmit = async (data: UserRightsFormValue) => {
    startTransition(async () => {
      try {
        const result = await updateUserRights(data);

        if (result.error) {
          toast.error(() => (
            <ToastContent title="Error" message={result.message} />
          ));
          return;
        }

        queryClient.invalidateQueries({
          queryKey: ['user-rights', data.userId],
        });
      } catch (error) {
        console.error('Error updating user rights:', error);
        toast.error(() => (
          <ToastContent
            title="Error"
            message="There was a problem while performing this action."
          />
        ));
      }
    });
  };

  const isLoading = isPending || isLoadingRights;
  return (
    <div className="space-y-6">
      <CloneForm users={users} />
      <Form {...form}>
        <form
          className="p-6 bg-card shadow-sm rounded-lg"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <SearchSelect
                options={users}
                value={field.value}
                onChange={field.onChange}
                emptyText="No users found"
                searchText="Search users..."
                placeholder="Select a user"
              />
            )}
          />
          <div className="mt-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-2 hidden">Form ID</th>
                  <th className="text-left p-2">Form Name</th>
                  <th className="text-left p-2">Module</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(formItem => {
                  return (
                    <tr key={formItem.id} className="border-b">
                      <td className="p-2">
                        <FormField
                          control={form.control}
                          name={`rights.${forms.indexOf(formItem)}.hasAccess`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={checked => {
                                    field.onChange(checked);
                                    handleCheckboxChange(
                                      formItem.id,
                                      checked as boolean
                                    );
                                  }}
                                  disabled={isLoading}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-2 hidden">{formItem.id}</td>
                      <td className="p-2 text-sm">
                        {formItem.formName.toUpperCase()}
                      </td>
                      <td className="p-2 text-sm">
                        {formItem.module.toUpperCase()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !selectedUserId}
              className="min-w-32"
              size="lg"
            >
              {isLoading ? (
                <ButtonLoader loadingText="Updating..." />
              ) : (
                <>
                  <ShieldCheckIcon />
                  <span>Update Rights</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function CloneForm({ users }: { users: Array<Option> }) {
  const { setOpen, setClose } = useModal();

  const form = useForm<CloneUserRightsFormValues>({
    defaultValues: {
      cloningFrom: '',
      cloningTo: '',
    },
    resolver: zodResolver(cloneUserRightsFormSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CloneUserRightsFormValues) => {
      return await cloneUserRights(data);
    },
    onSuccess: ctx => {
      if (ctx.error) {
        toast.error(() => (
          <ToastContent
            message={ctx.message}
            title="Error Cloning User Rights"
          />
        ));
        return;
      }
      form.reset();
      setClose();
      toast.success(() => (
        <ToastContent message={ctx.message} title="User Rights Cloned" />
      ));
    },
    onError: err => {
      toast.error(() => (
        <ToastContent message={err.message} title="Error Cloning User Rights" />
      ));
    },
  });

  const isSubmitting = isPending || form.formState.isSubmitting;

  function handleDisplayModal() {
    setOpen(
      <CustomModal
        title="Clone User Rights"
        subtitle="Clone the rights of an existing user"
      >
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(data => mutate(data))}
          >
            <FormField
              control={form.control}
              name="cloningFrom"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchSelect
                      options={users}
                      value={field.value}
                      onChange={field.onChange}
                      emptyText="No users found"
                      searchText="Search users..."
                      placeholder="Select user to clone from"
                      isPending={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cloningTo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchSelect
                      options={users}
                      value={field.value}
                      onChange={field.onChange}
                      emptyText="No users found"
                      searchText="Search users..."
                      placeholder="Select user to clone to"
                      isPending={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormActions
              resetFn={() => {
                form.reset();
                setClose();
              }}
              isPending={isSubmitting}
              actionButtonText="Clone Rights"
              cancelButtonText="Cancel"
              defaultButtonNames={false}
            />
          </form>
        </Form>
      </CustomModal>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="tertiary" size="lg" onClick={handleDisplayModal}>
        <CopyIcon />
        Clone Rights
      </Button>
    </div>
  );
}
