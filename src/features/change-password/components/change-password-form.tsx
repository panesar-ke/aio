'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { isAxiosError } from 'axios';
import { LockIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/change-password/utils/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/custom/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ButtonLoader } from '@/components/custom/loaders';
import { ToastContent } from '@/components/custom/toast';
import { changePasswordAction } from '@/features/change-password/services/action';

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordFormValues) {
    const res = await changePasswordAction(data);
    if (res.error) {
      toast.error(() => <ToastContent title="Error" message={res.message} />);
      return;
    }

    toast.success(() => (
      <ToastContent title="Success" message="Password changed successfully!" />
    ));

    form.reset();
  }

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-xl">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Enter your current password"
                        disabled={isPending}
                        onBlur={e => {
                          field.onBlur();
                          form.clearErrors('currentPassword');
                          axios
                            .post('/api/security/password-verify', {
                              currentPassword: e.target.value,
                            })
                            .catch(err => {
                              if (isAxiosError(err)) {
                                if (err.status !== 200) {
                                  form.setError('currentPassword', {
                                    type: 'manual',
                                    message:
                                      err.response?.data?.error ||
                                      'Invalid password entered',
                                  });
                                }
                              }
                            });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Enter your new password"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Confirm your new password"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? (
                  <ButtonLoader loadingText="Changing Password..." />
                ) : (
                  <>
                    <LockIcon className="size-4" />
                    <span>Change Password</span>
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
