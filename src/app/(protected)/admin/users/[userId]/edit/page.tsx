import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/admin/components/users/user-form';
import { getUser } from '@/features/admin/services/data';
import Link from 'next/link';

export const metadata = {
  title: 'Edit User',
};

export default async function EditUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUser(userId);
  return (
    <div className="space-y-6">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/admin/users">&larr; Back to users</Link>
      </Button>
      <UserForm
        user={{
          id: user.id,
          active: user.active,
          contact: user.contact,
          email: user.email!,
          name: user.name.toUpperCase(),
          userType: user.userType,
        }}
      />
    </div>
  );
}
