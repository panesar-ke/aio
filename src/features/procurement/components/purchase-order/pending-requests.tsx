import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";

import { FileTextIcon, SearchIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import type { PendingOrder } from "@/features/procurement/utils/procurement.types";
import type { Option } from "@/types/index.types";

import { DataTable } from "@/components/custom/datatable";
import { ToastContent } from "@/components/custom/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { deletePendingRequests } from "@/features/procurement/services/purchase-orders/actions";

interface PendingRequestsProps {
  pendingOrders: Array<PendingOrder>;
  projects: Array<Option>;
  onAddSelected: (selectedRequests: Array<PendingOrder>) => void;
}

export function PendingRequests({
  pendingOrders,
  projects,
  onAddSelected,
}: PendingRequestsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isPending, startTransition] = useTransition();

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.value, project.label])),
    [projects],
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pendingOrders;
    return pendingOrders.filter(
      (order) =>
        (order.itemName ?? "").toLowerCase().includes(query) ||
        (projectNameById.get(order.projectId) ?? "")
          .toLowerCase()
          .includes(query),
    );
  }, [search, pendingOrders, projectNameById]);

  const selectedRows = useMemo(
    () => pendingOrders.filter((order) => rowSelection[order.id]),
    [pendingOrders, rowSelection],
  );

  const columns: Array<ColumnDef<PendingOrder>> = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "itemName",
        header: "Product Name",
        cell: ({ row }) => (
          <div className="font-medium uppercase">
            {row.getValue("itemName")}
          </div>
        ),
      },
      {
        accessorKey: "projectId",
        header: "Project",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {projectNameById.get(row.original.projectId) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "qty",
        header: "Qty",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue("qty")}</Badge>
        ),
      },
    ],
    [projectNameById],
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setRowSelection({});
      setSearch("");
    }
  };

  const handleAddSelected = () => {
    if (selectedRows.length === 0) return;
    onAddSelected(selectedRows);
    handleOpenChange(false);
  };

  const handleDeleteSelected = () => {
    const ids = selectedRows.map((row) => String(row.requestId));
    startTransition(async () => {
      try {
        const result = await deletePendingRequests(ids);
        if (result.error) {
          toast.error(() => (
            <ToastContent title="Error" message={result.message} />
          ));
          return;
        }

        setRowSelection({});
        toast.success(() => (
          <ToastContent
            title="Success"
            message={`Deleted ${ids.length} pending request(s).`}
          />
        ));
      } catch (error) {
        console.error("Error deleting pending requests:", error);
        toast.error(() => (
          <ToastContent
            title="Error"
            message="There was a problem while performing this action."
          />
        ));
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary text-xs text-primary hover:bg-primary/10"
        >
          <FileTextIcon className="size-3.5" />
          Pending Requests
          {pendingOrders.length > 0 && (
            <Badge className="ml-1">{pendingOrders.length}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-3xl">
        <ScrollArea className="h-full">
          <SheetHeader className="pb-4">
            <SheetTitle>Pending Requests</SheetTitle>
            <SheetDescription>
              Select pending requests to add to your purchase order.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 pb-6">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product or project..."
                className="pl-8"
                aria-label="Search pending requests"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {selectedRows.length} of {pendingOrders.length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={selectedRows.length === 0 || isPending}
                  onClick={handleAddSelected}
                  size="sm"
                >
                  Add Selected ({selectedRows.length})
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={selectedRows.length === 0 || isPending}
                  onClick={handleDeleteSelected}
                  size="sm"
                >
                  Delete Selected
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </SheetClose>
              </div>
            </div>

            {pendingOrders.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredOrders}
                denseCell
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No pending requests available
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
