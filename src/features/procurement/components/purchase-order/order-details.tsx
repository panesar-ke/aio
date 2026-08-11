import { Trash2Icon } from "lucide-react";

import type {
  OrderFormDetailInput,
  PendingOrder,
} from "@/features/procurement/utils/procurement.types";
import type { Option } from "@/types/index.types";

import { notify } from "@/components/custom/toast";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { SelectItem } from "@/components/ui/select";
import { PendingRequests } from "@/features/procurement/components/purchase-order/pending-requests";
import { useProcurementServices } from "@/features/procurement/hooks/use-procurement-services";
import { calculateDiscount } from "@/features/procurement/utils/calculators";
import { purchaseOrderFormOpts } from "@/features/procurement/utils/form";
import { withForm } from "@/lib/form";
import { numberFormat } from "@/lib/helpers/formatters";
import { cn } from "@/lib/utils";

function lineHeaderClass(width: string, align: "left" | "center" = "left") {
  return cn(
    "whitespace-nowrap border-b bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
    align === "center" ? "text-center" : "text-left",
    width,
  );
}

function lineCellClass(width: string) {
  return cn(
    "flex items-center gap-2 py-1.5 before:w-24 before:shrink-0 before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.04em] before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:px-2 md:py-1.5 md:align-middle md:before:hidden",
    width,
  );
}

function readonlyCellClass(emphasized = false) {
  return cn(
    "flex h-10 w-full items-center justify-end border border-transparent px-3 text-sm tabular-nums text-muted-foreground",
    emphasized && "font-semibold text-foreground",
  );
}

function lineDiscount(line: OrderFormDetailInput | undefined) {
  if (!line) return 0;
  const gross = (Number(line.qty) || 0) * (Number(line.rate) || 0);
  return calculateDiscount(
    line.discountType ?? "NONE",
    Number(line.discount) || 0,
    gross,
  );
}

function lineGross(line: OrderFormDetailInput | undefined) {
  if (!line) return 0;
  return (Number(line.qty) || 0) * (Number(line.rate) || 0);
}

export const OrderDetails = withForm({
  ...purchaseOrderFormOpts(),
  props: {
    products: [] as Array<Option>,
    projects: [] as Array<Option>,
    services: [] as Array<Option>,
    pendingOrders: [] as Array<PendingOrder>,
  },
  render: function Render({
    form,
    products: initialProducts,
    projects: initialProjects,
    services: initialServices,
    pendingOrders,
  }) {
    const { products, projects, services } = useProcurementServices({
      products: initialProducts,
      projects: initialProjects,
      services: initialServices,
      include: ["products", "projects", "services"],
    });

    return (
      <form.AppField name="details" mode="array">
        {(field) => {
          const handleAddPendingRequests = (
            selectedRequests: Array<PendingOrder>,
          ) => {
            const existingIds = new Set(
              field.state.value.map((line) => line.id),
            );
            const newRequests = selectedRequests.filter(
              (request) => !existingIds.has(request.id),
            );
            if (newRequests.length === 0) {
              notify.error(
                "Already added",
                "The selected pending request(s) are already on this order",
              );
              return;
            }

            newRequests.forEach((request) => {
              field.pushValue({
                id: request.id,
                requestId: request.requestId,
                projectId: request.projectId,
                type: request.type,
                itemOrServiceId:
                  (request.type === "item"
                    ? request.itemId
                    : request.serviceId) ?? "",
                qty: Number(request.qty),
                rate: Number(request.rate) || 0,
                discountType: "NONE",
                discount: 0,
              });
            });
            notify.info(
              `Added ${selectedRequests.length} pending request(s) to order`,
              undefined,
              { position: "bottom-left" },
            );
          };

          return (
            <section className="bg-card border rounded-lg shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Order Details
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Items pulled from pending requisitions.
                  </p>
                </div>
                <PendingRequests
                  pendingOrders={pendingOrders}
                  projects={projects ?? initialProjects}
                  onAddSelected={handleAddPendingRequests}
                />
              </div>
              <FieldGroup className="overflow-x-auto gap-0">
                <table
                  aria-label="Purchase order line items"
                  className="w-full border-collapse md:table-fixed md:min-w-270"
                >
                  <thead className="hidden md:table-header-group">
                    <tr>
                      <th className={lineHeaderClass("w-10", "center")}>#</th>
                      <th className={lineHeaderClass("w-48")}>
                        Project <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-56")}>
                        Product <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-20")}>
                        Qty <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-28")}>
                        Rate <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-24")}>Gross</th>
                      <th className={lineHeaderClass("w-32")}>Disc. Type</th>
                      <th className={lineHeaderClass("w-24")}>Discount</th>
                      <th className={lineHeaderClass("w-24")}>Disc. Amt</th>
                      <th className={lineHeaderClass("w-28")}>Net</th>
                      <th className="w-11 border-b bg-muted px-2 py-2">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block w-full md:table-row-group">
                    {field.state.value.map((line, i) => (
                      <tr
                        key={line.id}
                        className="mb-3 block w-full rounded-lg border bg-card p-3 transition-colors md:mb-0 md:table-row md:rounded-none md:border-0 md:p-0 md:[&>td]:border-b md:[&>td]:border-border md:last:[&>td]:border-b-0 md:hover:[&>td]:bg-muted/40"
                      >
                        <td
                          data-label="#"
                          className="hidden md:table-cell md:w-10 md:px-2 md:py-1.5 md:text-center md:align-middle md:text-[11px] md:text-muted-foreground"
                        >
                          {i + 1}
                        </td>
                        <td
                          data-label="Project"
                          className={lineCellClass(
                            "md:w-48 md:max-w-48 md:overflow-hidden",
                          )}
                        >
                          <form.AppField name={`details[${i}].projectId`}>
                            {(field) => (
                              <field.Combobox
                                label=""
                                items={projects ?? []}
                                placeholder="Select project"
                                emptyMessage="Project not found"
                              />
                            )}
                          </form.AppField>
                        </td>
                        <td
                          data-label="Product"
                          className={lineCellClass(
                            "md:w-56 md:max-w-56 md:overflow-hidden",
                          )}
                        >
                          <form.Subscribe
                            selector={(state) => state.values.details[i]?.type}
                          >
                            {(lineType) => (
                              <form.AppField
                                name={`details[${i}].itemOrServiceId`}
                              >
                                {(field) => (
                                  <field.Combobox
                                    key={lineType ?? "empty"}
                                    label=""
                                    items={
                                      (lineType === "item"
                                        ? products
                                        : services) ?? []
                                    }
                                    placeholder="Select product"
                                    emptyMessage="Product not found"
                                  />
                                )}
                              </form.AppField>
                            )}
                          </form.Subscribe>
                        </td>
                        <td
                          data-label="Qty"
                          className={lineCellClass("md:w-20")}
                        >
                          <form.AppField name={`details[${i}].qty`}>
                            {(field) => (
                              <field.Input
                                label=""
                                type="number"
                                className="w-full text-right"
                              />
                            )}
                          </form.AppField>
                        </td>
                        <td
                          data-label="Rate"
                          className={lineCellClass("md:w-28")}
                        >
                          <form.AppField name={`details[${i}].rate`}>
                            {(field) => (
                              <field.Input
                                label=""
                                type="number"
                                placeholder="0.00"
                                className="w-full text-right"
                              />
                            )}
                          </form.AppField>
                        </td>
                        <td
                          data-label="Gross"
                          className={lineCellClass("md:w-24")}
                        >
                          <form.Subscribe
                            selector={(state) =>
                              lineGross(state.values.details[i])
                            }
                          >
                            {(gross) => (
                              <div className={readonlyCellClass()}>
                                {numberFormat(gross)}
                              </div>
                            )}
                          </form.Subscribe>
                        </td>
                        <td
                          data-label="Disc. Type"
                          className={lineCellClass("md:w-32")}
                        >
                          <form.AppField
                            name={`details[${i}].discountType`}
                            listeners={{
                              onChange: ({ value, fieldApi }) => {
                                if (value === "NONE") {
                                  fieldApi.form.setFieldValue(
                                    `details[${i}].discount`,
                                    0,
                                  );
                                }
                              },
                            }}
                          >
                            {(field) => (
                              <field.Select label="" className="w-full min-w-0">
                                <SelectItem value="NONE">None</SelectItem>
                                <SelectItem value="PERCENTAGE">
                                  Percentage
                                </SelectItem>
                                <SelectItem value="AMOUNT">Amount</SelectItem>
                              </field.Select>
                            )}
                          </form.AppField>
                        </td>
                        <td
                          data-label="Discount"
                          className={lineCellClass("md:w-24")}
                        >
                          <form.Subscribe
                            selector={(state) =>
                              state.values.details[i]?.discountType
                            }
                          >
                            {(discountType) => (
                              <form.AppField name={`details[${i}].discount`}>
                                {(field) => (
                                  <field.Input
                                    label=""
                                    type="number"
                                    placeholder="0"
                                    className="w-full text-right"
                                    disabled={
                                      !discountType || discountType === "NONE"
                                    }
                                  />
                                )}
                              </form.AppField>
                            )}
                          </form.Subscribe>
                        </td>
                        <td
                          data-label="Disc. Amt"
                          className={lineCellClass("md:w-24")}
                        >
                          <form.Subscribe
                            selector={(state) =>
                              lineDiscount(state.values.details[i])
                            }
                          >
                            {(discountedAmount) => (
                              <div className={readonlyCellClass()}>
                                {numberFormat(discountedAmount)}
                              </div>
                            )}
                          </form.Subscribe>
                        </td>
                        <td
                          data-label="Net"
                          className={lineCellClass("md:w-28")}
                        >
                          <form.Subscribe
                            selector={(state) => {
                              const line = state.values.details[i];
                              return lineGross(line) - lineDiscount(line);
                            }}
                          >
                            {(net) => (
                              <div className={readonlyCellClass(true)}>
                                {numberFormat(net)}
                              </div>
                            )}
                          </form.Subscribe>
                        </td>
                        <td className="flex justify-end pt-2 md:table-cell md:w-11 md:px-2 md:py-1.5 md:text-center md:align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => field.removeValue(i)}
                            aria-label={`Remove line ${i + 1}`}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2Icon
                              className="size-3.5"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {field.state.value.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No items added yet
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Select a vendor, then click{" "}
                      <strong>Pending Requests</strong> to pull in requisitioned
                      items.
                    </p>
                  </div>
                )}
                {field.state.value.length > 0 && (
                  <div className="flex items-center justify-between border-t px-5 py-3">
                    <p className="text-xs text-muted-foreground">
                      {field.state.value.length}{" "}
                      {field.state.value.length === 1 ? "line" : "lines"}
                    </p>
                  </div>
                )}
              </FieldGroup>
            </section>
          );
        }}
      </form.AppField>
    );
  },
});
