import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/admin/components/users/user-form';
import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'New User',
};
export default function NewUser() {
  return (
    <div className="space-y-6">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/admin/users">&larr; Back to users</Link>
      </Button>
      <UserForm />
    </div>
  );
}
