'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { CustomAlert } from '@/components/custom/custom-alert';
import { ButtonLoader } from '@/components/custom/loaders';
import { PasswordInput } from '@/components/custom/password-input';
import { notify } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { resetPasswordAction } from '@/features/auth/actions/password-reset';
import {
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from '@/features/auth/actions/schema';
import { useError } from '@/hooks/use-error';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { clearErrors, errors, onError } = useError();

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { token, newPassword: '', confirmPassword: '' },
    resolver: zodResolver(resetPasswordSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: ResetPasswordFormValues) {
    clearErrors();

    const result = await resetPasswordAction(data);

    if (result.error) {
      onError(result.message);
      return;
    }

    notify.success('Success', result.message);
    router.push('/login');
  }

  return (
    <div className="space-y-4">
      {errors && <CustomAlert variant="error" description={errors} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <ButtonLoader loadingText="Updating..." />
            ) : (
              <>
                <LockIcon className="size-4" />
                <span>Set new password</span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
