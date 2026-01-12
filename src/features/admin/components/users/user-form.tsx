'use client';
import PageHeader from '@/components/custom/page-header';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/features/admin/utils/admin.types';
import { useAppForm } from '@/lib/form';
import { userSchema } from '@/features/admin/utils/schema';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { upsertUser } from '@/features/admin/services/action';
import { ToastContent } from '@/components/custom/toast';
import toast from 'react-hot-toast';

const defaultValues = {
  active: true,
  contact: '',
  email: '',
  name: '',
  userType: 'STANDARD USER',
} as User;

export function UserForm({ user }: { user?: User }) {
  const form = useAppForm({
    defaultValues: user || defaultValues,
    validators: {
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await upsertUser({ ...value, id: user?.id });
      if (res.error) {
        toast.error(() => (
          <ToastContent message={res.message} title="Oops! This is akward!" />
        ));
        return;
      }
    },
  });
  return (
    <>
      <PageHeader
        title={user ? 'Edit User' : 'New User'}
        description={
          user ? 'Edit an existing user account.' : 'Create a new user account.'
        }
      />
      <Card className="shadow-none w-2xl mx-auto">
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup className="grid md:grid-cols-2 gap-4">
              <form.AppField name="name">
                {field => (
                  <field.Input
                    required
                    label="User Name"
                    placeholder="Enter user name"
                  />
                )}
              </form.AppField>
              <form.AppField name="contact">
                {field => (
                  <field.Input
                    required
                    label="Contact"
                    maxLength={10}
                    placeholder="Enter user contact"
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {field => (
                  <field.Input
                    type="email"
                    required
                    label="Email"
                    placeholder="Enter user contact"
                  />
                )}
              </form.AppField>
              <form.AppField name="userType">
                {field => (
                  <field.Select
                    required
                    label="User Type"
                    placeholder="Enter user type"
                  >
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STANDARD USER">Standard User</SelectItem>
                  </field.Select>
                )}
              </form.AppField>
            </FieldGroup>
            {user && (
              <FieldGroup>
                <form.AppField name="active">
                  {field => <field.Checkbox label="Active User" />}
                </form.AppField>
              </FieldGroup>
            )}
            <form.AppForm>
              <form.SubmitButton buttonText={user ? 'Update' : 'Save'} />
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
