'use client';

import type { Route } from 'next';

import { useSelector } from '@tanstack/react-form';
import { KeyRoundIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { loginAction } from '@/features/auth/actions/auth';
import { loginSchema } from '@/features/auth/actions/schema';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';

export function LoginForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      userName: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => loginAction(value),
        errorTitle: 'Error signing in',
        successTitle: 'Welcome back',
        fallbackMessage: 'Failed to sign in. Please try again.',
        onSuccess: (destination) => {
          form.reset();
          const safeDestination =
            destination &&
            destination.startsWith('/') &&
            !destination.startsWith('//')
              ? destination
              : '/dashboard';
          router.push(safeDestination as Route);
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
        <form.AppField name='userName'>
          {(field) => (
            <field.Input
              label='Contact/Email'
              placeholder='jsmith@example.com'
            />
          )}
        </form.AppField>
        <form.AppField name='password'>
          {(field) => (
            <field.Input label='Password' placeholder='*******' isPassword />
          )}
        </form.AppField>
        <div className='flex justify-end'>
          <Link
            href='/forgot-password'
            prefetch={false}
            className='text-link text-sm transition-all hover:underline'
          >
            Forgot Password?
          </Link>
        </div>
      </FieldGroup>
      <FieldGroup>
        <Button type='submit' className='w-full' size='lg' disabled={isPending}>
          <LoadingSwap
            isLoading={isPending}
            className='flex items-center gap-2'
          >
            <>
              <KeyRoundIcon />
              <span>Sign In</span>
            </>
          </LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}
