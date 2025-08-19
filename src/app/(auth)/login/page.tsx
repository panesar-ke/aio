import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          alt="Panesars Kenya Ltd logo"
          src="/logos/logo-light.svg"
          //   layout="responsive"
          height={360}
          width={600}
          className="w-[148px] h-auto  mx-auto"
          priority
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
  );
}
