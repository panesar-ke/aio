import type { Metadata } from 'next';
import PageHeader from '@/components/custom/page-header';
import { ChangePasswordForm } from '@/features/change-password/components/change-password-form';

export const metadata: Metadata = {
  title: 'Change Password',
};

export default async function ChangePasswordPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Change Password"
        description="Change your account password"
      />
      <ChangePasswordForm />
    </div>
  );
}
