import PageHeader from '@/components/custom/page-header';
import { ButtonLink } from '@/components/ui/button';
import { ResetPasswordForm } from '@/features/admin/components/users/reset-password-form';
import { getUser } from '@/features/admin/services/data';
import { titleCase } from '@/lib/helpers/formatters';

export const metadata = {
  title: 'Reset user password',
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUser(userId);
  return (
    <div className="space-y-6">
      <ButtonLink path="/admin/users" variant="secondary">
        &larr; Back to users
      </ButtonLink>
      <PageHeader
        title="Reset Password"
        description={`Reset ${titleCase(user.name.split(' ')[0])}'s password`}
      />
      <ResetPasswordForm />
    </div>
  );
}
