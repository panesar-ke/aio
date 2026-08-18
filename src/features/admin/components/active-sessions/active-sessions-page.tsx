'use client';

import { type ColumnDef, type RowSelectionState } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { MonitorIcon } from 'lucide-react';
import { useState } from 'react';
import { UAParser } from 'ua-parser-js';

import type { ActiveSession } from '@/features/admin/utils/admin.types';
import type { SessionPayload } from '@/types/index.types';

import { CreatorAvatar } from '@/components/custom/avatars';
import { DataTable } from '@/components/custom/datatable';
import Search from '@/components/custom/search';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useActiveSessionsFilters } from '@/features/admin/hooks/use-filters';

import { revokeSession } from '../../services/action';
import { getRevocableSessionIds, isSessionSelectable } from './selection';

export function ClientActiveSessionsPage({
  sessions,
  session,
}: {
  sessions: Array<ActiveSession>;
  session: SessionPayload;
}) {
  const { filters, onHandleSearch } = useActiveSessionsFilters();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleRevokeMultipleSessions = async () => {
    const revocableSessionIds = getRevocableSessionIds(
      rowSelection,
      session.sessionId,
    );

    if (revocableSessionIds.length === 0) {
      return;
    }

    await revokeSession(revocableSessionIds);
    setRowSelection({});
  };

  const columns: Array<ColumnDef<ActiveSession>> = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }) => (
        <div className='flex items-center gap-x-2'>
          <CreatorAvatar userName={row.original.userName} />
          <span className='text-sm capitalize'>{row.original.userName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'userAgent',
      header: 'Device / Browser',
      cell: ({ row }) => {
        const userAgent = row.original.userAgent;
        if (!userAgent) return '-';
        const { browser, os } = UAParser(userAgent);

        return (
          <div className='flex items-center gap-x-2'>
            <MonitorIcon className='size-4 text-muted-foreground' />
            <span className='text-sm capitalize'>
              {browser.name} on {os.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({
        row: {
          original: { ipAddress },
        },
      }) => <span className='text-muted-foreground'>{ipAddress || '-'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Signed In',
      cell: ({
        row: {
          original: { createdAt },
        },
      }) => (
        <span className='text-sm'>
          {format(new Date(createdAt), 'dd MMM, hh:mm a')}
        </span>
      ),
    },
    {
      accessorKey: 'lastActivityAt',
      header: 'Last Activity',
      cell: ({
        row: {
          original: { lastActivityAt },
        },
      }) =>
        lastActivityAt ? (
          <span className='text-sm'>
            {formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isActiveSession = row.original.id === session.sessionId;
        if (isActiveSession) {
          return <Badge variant='info'>Current Session</Badge>;
        }
        return (
          <ActionButton
            variant='link'
            className='text-rose-600 hover:text-rose-500'
            action={async () => revokeSession(row.original.id)}
            requireAreYouSure={true}
          >
            Revoke
          </ActionButton>
        );
      },
    },
  ];
  return (
    <>
      <Search
        key={filters.search}
        defaultValue={filters.search}
        placeholder='Search by user or email...'
        onHandleSearch={onHandleSearch}
        parentClassName='max-w-xl'
      />
      {getRevocableSessionIds(rowSelection, session.sessionId).length > 0 && (
        <Button className='w-fit' onClick={handleRevokeMultipleSessions}>
          Revoke selected (
          {getRevocableSessionIds(rowSelection, session.sessionId).length})
        </Button>
      )}
      <DataTable
        columns={columns}
        data={sessions}
        enableRowSelection={(row) =>
          isSessionSelectable(row.original.id, session.sessionId)
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
      />
    </>
  );
}
