'use client';
// biome-ignore assist/source/organizeImports: <Too annoying to fix>
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { KeyRoundIcon } from 'lucide-react';
import type z from 'zod';

import { loginSchema } from '@/features/auth/actions/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/custom/password-input';
import { Button } from '@/components/ui/button';
import { CustomAlert } from '@/components/custom/custom-alert';
import { useError } from '@/hooks/use-error';
import { loginAction } from '@/features/auth/actions/auth';
import { setFormErrors } from '@/lib/helpers/errors';
import { ButtonLoader } from '@/components/custom/loaders';

export function LoginForm() {
  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      userName: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });
  const { clearErrors, errors, onError } = useError();
  const isPending = form.formState.isSubmitting;

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    clearErrors();
    const results = await loginAction(data);

    if (results.errors) {
      setFormErrors(form, results.errors);
      return;
    }

    if (!results.success) {
      onError(results.message);
      return;
    }
  }

  return (
    <div className="space-y-4">
      {errors && <CustomAlert variant="error" description={errors} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="userName"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-link text-sm transition-all hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    {...field}
                    placeholder="*******"
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
              <ButtonLoader loadingText="Processing..." />
            ) : (
              <>
                <KeyRoundIcon />
                <span>Sign In</span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
