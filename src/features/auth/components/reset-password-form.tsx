'use client';

import { useSelector } from '@tanstack/react-form';
import { LockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { resetPasswordAction } from '@/features/auth/actions/password-reset';
import { resetPasswordSchema } from '@/features/auth/actions/schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: { token, newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => resetPasswordAction(value),
        errorTitle: `Error resetting password`,
        successTitle: `Password reset successfully`,
        fallbackMessage: `Failed to reset password. Please try again.`,
        onSuccess: () => {
          form.reset();
          router.push('/login');
        },
      });
    },
  });

  const isPending = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      <FieldGroup>
        <form.AppField name='newPassword'>
          {(field) => (
            <field.Input
              label='New Password'
              placeholder='Enter your new password'
              isPassword
            />
          )}
        </form.AppField>
        <form.AppField name='confirmPassword'>
          {(field) => (
            <field.Input
              label='Confirm New Password'
              placeholder='Confirm your new password'
              isPassword
            />
          )}
        </form.AppField>
      </FieldGroup>
      <FieldGroup>
        <Button type='submit' className='w-full' size='lg' disabled={isPending}>
          <LoadingSwap
            isLoading={isPending}
            className='flex items-center gap-2'
          >
            <>
              <LockIcon className='size-4' />
              <span>Set new password</span>
            </>
          </LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}
