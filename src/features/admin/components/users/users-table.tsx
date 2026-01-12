'use client';

import { EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { ToastContent } from '@/components/custom/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { getUsers } from '@/features/admin/services/data';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { BanIcon, CheckIcon, Undo2Icon, UserLockIcon } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { toggleUserActiveState } from '@/features/admin/services/action';

type User = Awaited<ReturnType<typeof getUsers>>[number];
export function UsersDatatable({ users }: { users: Array<User> }) {
  const [isPending, startTransition] = useTransition();

  function handleToogleActiveState(userId: string, currentState: boolean) {
    startTransition(async () => {
      console.log('Toggling user:', userId, 'Current state:', currentState);
      const response = await toggleUserActiveState(userId, currentState);
      if (response.error) {
        toast.error(() => (
          <ToastContent
            title="Error updating user state"
            message={response.message}
          />
        ));
        return;
      }
    });
  }

  const columns: Array<ColumnDef<User>> = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => (
        <UserAvatar
          userName={row.original.name}
          image={row.original.image || undefined}
        />
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'userType',
      header: 'User Type',
      cell: ({ row }) => {
        const userType = row.original.userType;
        return (
          <Badge
            variant={userType === 'STANDARD USER' ? 'secondary' : 'info'}
            className="capitalize"
          >
            {userType}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.active ? 'Active' : 'Inactive';
        return (
          <Badge
            variant={row.original.active ? 'success' : 'error'}
            className="capitalize"
          >
            {status === 'Active' ? (
              <CheckIcon className="size-3 text-success-foreground" />
            ) : (
              <BanIcon className="size-3 text-error-foreground" />
            )}
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({
        row: {
          original: { id, active },
        },
      }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${id}/edit`}>
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${id}/reset-password`}>
                <Undo2Icon className="size-3 text-muted-foreground" />
                <span className="text-xs">Reset Password</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => handleToogleActiveState(id, active)}
            >
              {active ? (
                <UserLockIcon className="size-3 text-error-foreground" />
              ) : (
                <CheckIcon className="size-3 text-success-foreground" />
              )}
              <span
                className={cn(
                  'text-xs ',
                  active ? 'text-error-foreground' : 'text-success-foreground'
                )}
              >
                {active ? 'Deactivate User' : 'Activate User'}
              </span>
            </DropdownMenuItem>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable columns={columns} data={users} />;
}

export function UserAvatar({
  userName,
  image,
}: {
  userName: string;
  image?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarImage src={image} alt={userName} />
        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <p className="font-medium capitalize">{userName.toLowerCase()}</p>
    </div>
  );
}
