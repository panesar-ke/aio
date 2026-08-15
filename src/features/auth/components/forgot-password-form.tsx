'use client';

import { useSelector } from '@tanstack/react-form';
import { LogInIcon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CustomAlert } from '@/components/custom/custom-alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { requestPasswordResetAction } from '@/features/auth/actions/password-reset';
import { forgotPasswordSchema } from '@/features/auth/actions/schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function ForgotPasswordForm() {
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { identifier: '' },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => requestPasswordResetAction(value),
        errorTitle: `Error sending reset link`,
        successTitle: `✅ Link sent`,
        fallbackMessage: `Failed to send reset link. Please try again.`,
        onSuccess: (res) => {
          setSentMessage(`Reset link sent to ${res || 'your email'}`);
          form.reset();
        },
      });
    },
  });

  const isPending = useSelector(form.store, (state) => state.isSubmitting);

  if (sentMessage) {
    return (
      <div className='space-y-4'>
        <CustomAlert variant='success' description={sentMessage} />
        <p className='text-sm text-muted-foreground'>
          The link expires in 30 minutes and can only be used once. Check your
          spam folder if it does not arrive.
        </p>
        <Button asChild variant='outline' className='w-full'>
          <Link href='/login' prefetch={false}>
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      <FieldGroup>
        <form.AppField name='identifier'>
          {(field) => (
            <field.Input
              placeholder='jsmith@example.com'
              label='Contact/Email'
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
              <MailIcon />
              <span>Send reset link</span>
            </>
          </LoadingSwap>
        </Button>
      </FieldGroup>

      <Button asChild variant='ghost' className='w-full'>
        <Link href='/login' prefetch={false}>
          <LogInIcon />
          Back to sign in
        </Link>
      </Button>
    </form>
  );
}
