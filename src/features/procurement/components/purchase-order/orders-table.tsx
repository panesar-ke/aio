import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { purchaseOrdersQueryOptions } from '@/features/procurement/utils/query-options'
import type { OrderTableRow } from '@/features/procurement/utils/procurement.types'
import { DataTableColumnHeader } from '@/components/custom/datatable-column-header'
import { dateFormat, numberFormat } from '@/lib/helpers/formatters'
import { DataTable } from '@/components/custom/datatable'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger'
import CustomDropdownContent from '@/components/custom/custom-dropdown-content'
import {
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from '@/components/custom/custom-button'
import { ActionButton } from '@/components/ui/action-button'

export function OrdersTable({ q }: { q?: string }) {
  const queryClient = useQueryClient()
  async function handleDelete(requisitionId: string) {
    // const response = await deleteRequisition({ data: requisitionId })
    // if (response.error) return { error: true, message: response.message }
    queryClient.invalidateQueries({ queryKey: ['material_requisitions'] })
    queryClient.invalidateQueries({
      queryKey: ['material_requisitions', requisitionId],
    })

    return { error: false, message: 'Requisition deleted successfully' }
  }
  const { data } = useSuspenseQuery(purchaseOrdersQueryOptions.all(q))
  const columns: Array<ColumnDef<OrderTableRow>> = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order #" />
      ),
    },
    {
      accessorKey: 'orderDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Date" />
      ),
      cell: ({ row }) => dateFormat(row.original.orderDate, 'long'),
    },
    {
      accessorKey: 'vendor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => row.original.vendor.toUpperCase(),
    },

    {
      accessorKey: 'createdBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium capitalize">
            {row.original.createdBy}
          </div>
          <div className="text-xs text-muted-foreground">
            {dateFormat(row.original.createdAt, 'long')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Total" />
      ),
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold">
          {numberFormat(row.original.totalAmount)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({
        row: {
          original: { reference },
        },
      }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem asChild>
              <Link
                to="/procurement/purchase-order/$orderId/edit"
                params={{ orderId: reference }}
              >
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/procurement/purchase-order/$orderId/details"
                params={{ orderId: reference }}
              >
                <ViewDetailsAction />
              </Link>
            </DropdownMenuItem>
            <ActionButton
              variant="ghost"
              className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
              action={handleDelete.bind(null, reference)}
              requireAreYouSure={true}
            >
              <DeleteAction />
            </ActionButton>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ]
  return <DataTable data={data} columns={columns} denseCell />
}
