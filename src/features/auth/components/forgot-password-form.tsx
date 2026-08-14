'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CustomAlert } from '@/components/custom/custom-alert';
import { ButtonLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { requestPasswordResetAction } from '@/features/auth/actions/password-reset';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/features/auth/actions/schema';
import { useError } from '@/hooks/use-error';

export function ForgotPasswordForm() {
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const { clearErrors, errors, onError } = useError();

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { identifier: '' },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordFormValues) {
    clearErrors();
    setSentMessage(null);

    const result = await requestPasswordResetAction(data);

    if (result.error) {
      onError(result.message);
      return;
    }

    setSentMessage(result.message);
    form.reset();
  }

  if (sentMessage) {
    return (
      <div className="space-y-4">
        <CustomAlert variant="success" description={sentMessage} />
        <p className="text-sm text-muted-foreground">
          The link expires in 30 minutes and can only be used once. Check your
          spam folder if it does not arrive.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login" prefetch={false}>
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors && <CustomAlert variant="error" description={errors} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact/Email</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    placeholder="jsmith@example.com"
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
              <ButtonLoader loadingText="Sending..." />
            ) : (
              <>
                <MailIcon />
                <span>Send reset link</span>
              </>
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login" prefetch={false}>
              Back to sign in
            </Link>
          </Button>
        </form>
      </Form>
    </div>
  );
}
