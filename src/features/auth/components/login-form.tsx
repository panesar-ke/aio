import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type z from 'zod'

import { loginSchema } from '@/features/auth/lib/schemas'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/custom/password-input'
import { Button } from '@/components/ui/button'
import { CustomAlert } from '@/components/custom/custom-alert'
import { useError } from '@/hooks/use-error'
import { loginFn } from '@/features/auth/server-functions'
import { LoadingSwap } from '@/components/ui/loading-swap'

export function LoginForm() {
  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      userName: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  })
  const { clearErrors } = useError()
  const router = useRouter()
  const {
    mutate,
    isPending,
    data: response,
  } = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      return await loginFn({
        data: { userName: data.userName, password: data.password },
      })
    },
  })

  function onSubmit(data: z.infer<typeof loginSchema>) {
    clearErrors()
    mutate(
      { userName: data.userName, password: data.password },
      {
        onSuccess: async (ctx) => {
          if (!ctx.error) {
            await router.invalidate()
            router.navigate({ to: '/dashboard' })
            return
          }
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {response?.error && (
        <CustomAlert variant="error" description={response.message} />
      )}
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
                    to="/forgot-password"
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
            className="w-full "
            size="lg"
            disabled={isPending}
          >
            <LoadingSwap loadingText="Authenticating..." isLoading={isPending}>
              LOGIN
            </LoadingSwap>
          </Button>
        </form>
      </Form>
    </div>
  )
}
