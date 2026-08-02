"use client";
import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import type { OrderTableRow } from "@/features/procurement/utils/procurement.types";

import { PermissionGate } from "@/components/auth/client-permission-gate";
import {
  DeleteAction,
  EditAction,
  ViewDetailsAction,
} from "@/components/custom/custom-button";
import { CustomDropdownContent } from "@/components/custom/custom-dropdown-content";
import { CustomDropdownTrigger } from "@/components/custom/custom-dropdown-trigger";
import { DataTable } from "@/components/custom/datatable";
import { ActionButton } from "@/components/ui/action-button";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/admin/components/users/users-table";
import { deleteOrder } from "@/features/procurement/services/purchase-orders/actions";
import { dateFormat, numberFormat, titleCase } from "@/lib/helpers/formatters";

export function OrdersTable({ orders }: { orders: Array<OrderTableRow> }) {
  async function handleDelete(orderId: string) {
    const response = await deleteOrder(orderId);
    return { error: response.error, message: response.message };
  }

  const columns: Array<ColumnDef<OrderTableRow>> = [
    {
      accessorKey: "id",
      header: "Order #",
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => dateFormat(row.original.orderDate, "long"),
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => titleCase(row.original.vendor.toLowerCase()),
    },

    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserAvatar userName={row.original.createdBy} />
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: () => <div className="text-right">Order Total</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {numberFormat(row.original.totalAmount)}
        </div>
      ),
    },
    {
      id: "actions",
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
                href={`/procurement/purchase-order/${reference}/edit`}
                prefetch={false}
              >
                <EditAction />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/procurement/purchase-order/${reference}/details`}
                prefetch={false}
              >
                <ViewDetailsAction />
              </Link>
            </DropdownMenuItem>
            <PermissionGate permissions={["procurement:admin"]}>
              <ActionButton
                variant="ghost"
                className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
                action={handleDelete.bind(null, reference)}
                requireAreYouSure={true}
              >
                <DeleteAction />
              </ActionButton>
            </PermissionGate>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];
  return <DataTable data={orders} columns={columns} denseCell />;
}
