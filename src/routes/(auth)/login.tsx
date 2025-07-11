import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/features/auth/components/login-form'

export const Route = createFileRoute('/(auth)/login')({
  head: () => ({
    meta: [
      {
        title: 'Login / PKL AIO',
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Panesars Kenya Ltd logo"
          src="/logos/logo-light.svg"
          height={360}
          width={600}
          className="w-[148px] h-auto  mx-auto"
        />
      </div>
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-0.5  mt-2 mb-6">
          <h2 className="text-center text-2xl/9 tracking-tight font-display">
            Sign in to your account
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your credentials to access your account.
          </p>
        </div>
        <LoginForm />
      </div>
    </>
  )
}
