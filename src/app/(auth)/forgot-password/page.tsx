import type { Metadata } from 'next';

import Image from 'next/image';

import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image
          alt="Panesars Kenya Ltd logo"
          src="/logos/logo-light.svg"
          height={360}
          width={600}
          className="w-[148px] h-auto mx-auto"
          priority
        />
      </div>
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-0.5 mt-2 mb-6">
          <h2 className="text-center text-2xl/9 tracking-tight font-display">
            Forgot your password?
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email or contact and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </>
  );
}
