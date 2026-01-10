'use client';

import { EditAction } from '@/components/custom/custom-button';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { DataTable } from '@/components/custom/datatable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { getUsers } from '@/features/admin/services/data';
import type { ColumnDef } from '@tanstack/react-table';
import { BanIcon, CheckIcon, Undo2Icon, UserLockIcon } from 'lucide-react';
import Link from 'next/link';

type User = Awaited<ReturnType<typeof getUsers>>[number];
export function UsersDatatable({ users }: { users: Array<User> }) {
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
      cell: ({ row }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${row.original.id}/edit`}>
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Undo2Icon className="size-3 text-muted-foreground" />
              <span className="text-xs">Reset Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserLockIcon className="size-3 text-destructive" />
              <span className="text-xs text-destructive">Deactivate User</span>
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
      <p className="font-medium capitalize">{userName}</p>
    </div>
  );
}
