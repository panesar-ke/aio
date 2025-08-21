'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { userRightsFormSchema } from '@/features/admin/utils/schema';
import { UserRightsFormValue } from '@/features/admin/utils/admin.types';

export function RightsForm() {
  return (
    <div className="space-y-6">
      <CloneForm />
      <UserRightsForm />
    </div>
  );
}

function UserRightsForm() {
  const form = useForm<UserRightsFormValue>({
    defaultValues: {
      userId: '',
      rights: [],
    },
    resolver: zodResolver(userRightsFormSchema),
  });
  return (
    <Form {...form}>
      <form className="p-6 bg-card shadow-sm rounded-lg">form</form>
    </Form>
  );
}

function CloneForm() {
  return (
    <div className="space-y-6">
      <Button variant="tertiary" size="lg">
        <CopyIcon />
        Clone Rights
      </Button>
    </div>
  );
}
