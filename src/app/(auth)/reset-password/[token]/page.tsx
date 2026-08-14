import type { Metadata } from 'next';

import Image from 'next/image';
import Link from 'next/link';

import { CustomAlert } from '@/components/custom/custom-alert';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { findValidResetToken } from '@/features/auth/services/data';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Choose a new password',
};

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
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
        <ErrorBoundaryWithSuspense
          errorMessage="An error occurred while checking your reset link"
          loader={<FormLoader />}
        >
          <ResetPasswordContent params={params} />
        </ErrorBoundaryWithSuspense>
      </div>
    </>
  );
}

async function ResetPasswordContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await findValidResetToken(token);

  if (!valid) {
    return (
      <div className="space-y-4">
        <CustomAlert
          variant="error"
          description="That reset link is invalid or has expired. Reset links last 30 minutes and can only be used once."
        />
        <Button asChild className="w-full">
          <Link href="/forgot-password" prefetch={false}>
            Request a new link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0.5 mt-2 mb-6">
        <h2 className="text-center text-2xl/9 tracking-tight font-display">
          Choose a new password
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          Choose a password you have not used before.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  );
}
