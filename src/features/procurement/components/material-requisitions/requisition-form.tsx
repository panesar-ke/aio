"use client";

import { createId } from "@paralleldrive/cuid2";
import { useSelector } from "@tanstack/react-store";
import {
  CircleXIcon,
  PlusIcon,
  SaveIcon,
  SparkleIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import type {
  MaterialRequisitionFormValues,
  Requisition,
} from "@/features/procurement/utils/procurement.types";
import type { Option } from "@/types/index.types";

import FormHeader from "@/components/custom/form-header";
import { ToastContent } from "@/components/custom/toast";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { SelectItem } from "@/components/ui/select";
import { createRequisition } from "@/features/procurement/services/material-requisitions/action";
import { useAppForm, withForm } from "@/lib/form";
import { handleSubmitFeedback } from "@/lib/form-submit-feedback";
import { dateFormat } from "@/lib/helpers/formatters";
import { cn } from "@/lib/utils";

import {
  getNextTemporaryRequestId,
  useNextRequestId,
} from "../../hooks/use-next-request-id";
import { useProcurementServices } from "../../hooks/use-procurement-services";
import { materialRequisitionFormOpts } from "../../utils/form";

interface RequisitionFormProps {
  requisitionNo: number;
  projects: Array<Option>;
  products: Array<Option>;
  services: Array<Option>;
  requisition?: Requisition;
}

type LineItemType = MaterialRequisitionFormValues["details"][number]["type"];

function getLineItemOptions(
  type: LineItemType | undefined,
  options: { products?: Array<Option>; services?: Array<Option> },
): Array<Option> {
  if (type === "item") return options.products ?? [];
  if (type === "service") return options.services ?? [];
  return [];
}

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

type FormAction = "save" | "save-and-generate";

export function RequisitionForm({
  products,
  projects,
  requisitionNo,
  services,
  requisition,
}: RequisitionFormProps) {
  const [actionState, setActionState] = useState<FormAction | null>(null);
  const router = useRouter();
  const actionRef = useRef<FormAction>("save");
  const isEdit = !!requisition;

  const { defaultDetails } = useNextRequestId(requisition);

  const initialFormValues = useMemo<MaterialRequisitionFormValues | undefined>(
    () =>
      requisition
        ? ({
            id: requisition.reference,
            documentNo: requisitionNo,
            documentDate: dateFormat(new Date(requisition.documentDate)),
            details: defaultDetails,
          } as unknown as MaterialRequisitionFormValues)
        : undefined,
    [requisition, requisitionNo, defaultDetails],
  );

  const formOpts = useMemo(
    () => materialRequisitionFormOpts(requisitionNo, initialFormValues),
    [requisitionNo, initialFormValues],
  );
  const appForm = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      if (value.details.length === 0) {
        toast.error(() => (
          <ToastContent
            message="At least one item is required"
            title="Validation Error"
          />
        ));
        return;
      }

      const action = actionRef.current;
      await handleSubmitFeedback({
        action: () => createRequisition(value),
        errorTitle: `Error ${isEdit ? "updating" : "creating"} requisition`,
        successTitle: `✅ ${isEdit ? "Updated" : "Created"}`,
        fallbackMessage: `Failed to ${isEdit ? "update" : "create"} requisition. Please try again.`,
        onSuccess: (data) => {
          appForm.reset();
          if (!data) {
            router.push("/procurement/material-requisition");
            return;
          }
          router.push(
            action === "save"
              ? `/procurement/material-requisition/${data}/details`
              : `/procurement/purchase-order/new?requisition=${data}`,
          );
        },
      });
    },
  });

  function handleSubmit(action: FormAction) {
    actionRef.current = action;
    setActionState(action);
    appForm.handleSubmit();
  }

  const isSubmitting = useSelector(
    appForm.store,
    (state) => state.isSubmitting,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto pb-6 space-y-6">
        <div className="space-y-6">
          <FormHeader
            title={
              isEdit
                ? "Edit Material Requisition"
                : "Create Material Requisition"
            }
            description={
              isEdit
                ? "Edit an existing material requisition"
                : "Create a new material requisition"
            }
          />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            appForm.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup className="bg-white border p-6 rounded-lg shadow-sm max-w-xl">
            <FieldSet>
              <FieldLegend>Document Details</FieldLegend>
              <FieldGroup className="grid lg:grid-cols-2 gap-6">
                <appForm.AppField name="documentNo">
                  {(field) => <field.Input label="Document No" readOnly />}
                </appForm.AppField>
                <appForm.AppField name="documentDate">
                  {(field) => <field.Input label="Document Date" type="date" />}
                </appForm.AppField>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
          <RequisitionDetails
            form={appForm}
            products={products}
            projects={projects}
            services={services}
          />
        </form>
      </div>
      <footer className="sticky bottom-0 z-10 border-t bg-background">
        <div className="flex flex-col md:flex-row justify-end py-4 gap-2">
          <Button
            type="button"
            onClick={() => handleSubmit("save")}
            size="lg"
            disabled={isSubmitting}
            className="min-w-32"
          >
            <LoadingSwap
              isLoading={isSubmitting && actionState === "save"}
              className="flex gap-2 items-center"
            >
              <SaveIcon />
              <span>Save</span>
            </LoadingSwap>
          </Button>
          <Button
            type="button"
            variant="tertiary"
            onClick={() => handleSubmit("save-and-generate")}
            size="lg"
            className="min-w-32"
            disabled={isSubmitting}
          >
            <LoadingSwap
              isLoading={isSubmitting && actionState === "save-and-generate"}
              className="flex gap-2 items-center"
            >
              <>
                <SparkleIcon />
                <span>Save & Generate PO</span>
              </>
            </LoadingSwap>
          </Button>
          <Button
            disabled={isSubmitting}
            variant="outline"
            size="lg"
            className="min-w-32"
            onClick={() => appForm.reset()}
          >
            <CircleXIcon />
            <span>Cancel</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}

const RequisitionDetails = withForm({
  ...materialRequisitionFormOpts(),
  props: {
    products: [] as Array<Option>,
    projects: [] as Array<Option>,
    services: [] as Array<Option>,
  },
  render: function Render({
    form,
    products: initialProducts,
    projects: initialProjects,
    services: initialServices,
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
          const addLine = () => {
            field.pushValue({
              id: createId(),
              projectId: "",
              type: "item",
              itemOrServiceId: "",
              qty: 1,
              remarks: "",
              requestId: getNextTemporaryRequestId(field.state.value),
            });
          };
          return (
            <section className="bg-white border rounded-lg shadow-sm gap-0 overflow-hidden ">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Requisition Lines
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Add each item or service being requested.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  className="border-primary text-xs text-primary hover:bg-primary/10"
                >
                  <PlusIcon className="size-3.5" />
                  Add Line
                </Button>
              </div>
              <FieldGroup className="overflow-x-auto">
                <table
                  aria-label="Item Details"
                  className="w-full border-collapse md:table-fixed"
                >
                  <thead className="hidden md:table-header-group">
                    <tr>
                      <th className={lineHeaderClass("w-10", "center")}>#</th>
                      <th className={lineHeaderClass("w-28")}>Item Type</th>
                      <th className={lineHeaderClass("w-72")}>
                        Product / Service{" "}
                        <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-24 min-w-20")}>
                        Qty <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-56")}>
                        Project <span className="text-destructive">*</span>
                      </th>
                      <th className={lineHeaderClass("w-40")}>Remarks</th>
                      <th className="w-11 border-b bg-muted px-2 py-2">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block w-full md:table-row-group">
                    {field.state.value.map((f, i) => {
                      return (
                        <tr
                          key={f.id}
                          className="mb-3 block w-full rounded-lg border bg-card p-3 transition-colors md:mb-0 md:table-row md:rounded-none md:border-0 md:p-0 md:[&>td]:border-b md:[&>td]:border-border md:last:[&>td]:border-b-0 md:hover:[&>td]:bg-muted/40"
                        >
                          <td
                            data-label="#"
                            className="hidden md:table-cell md:w-10 md:px-2 md:py-1.5 md:text-center md:align-middle md:text-[11px] md:text-muted-foreground"
                          >
                            {i + 1}
                          </td>
                          <td
                            data-label="Item Type"
                            className={lineCellClass("md:w-28")}
                          >
                            <form.AppField
                              name={`details[${i}].type`}
                              listeners={{
                                onChange: ({ fieldApi }) => {
                                  fieldApi.form.setFieldValue(
                                    `details[${i}].itemOrServiceId`,
                                    "",
                                  );
                                },
                              }}
                            >
                              {(field) => (
                                <field.Select
                                  label=""
                                  className="w-full min-w-0"
                                >
                                  <SelectItem value="item">Product</SelectItem>
                                  <SelectItem value="service">
                                    Service
                                  </SelectItem>
                                </field.Select>
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label="Product / Service"
                            className={lineCellClass(
                              "md:w-72 md:max-w-72 md:overflow-hidden",
                            )}
                          >
                            <form.Subscribe
                              selector={(state) =>
                                state.values.details[i]?.type
                              }
                            >
                              {(lineType) => {
                                const itemOptions = getLineItemOptions(
                                  lineType,
                                  {
                                    products,
                                    services,
                                  },
                                );

                                return (
                                  <form.AppField
                                    name={`details[${i}].itemOrServiceId`}
                                  >
                                    {(field) => (
                                      <field.Combobox
                                        key={lineType ?? "empty"}
                                        label=""
                                        items={itemOptions}
                                        placeholder="Select..."
                                      />
                                    )}
                                  </form.AppField>
                                );
                              }}
                            </form.Subscribe>
                          </td>
                          <td
                            data-label="Qty"
                            className={lineCellClass("md:w-24")}
                          >
                            <form.AppField name={`details[${i}].qty`}>
                              {(field) => (
                                <field.Input
                                  label=""
                                  type="number"
                                  className="w-full"
                                />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label="Project"
                            className={lineCellClass(
                              "md:w-56 md:max-w-56 md:overflow-hidden",
                            )}
                          >
                            <form.AppField name={`details[${i}].projectId`}>
                              {(field) => (
                                <field.Combobox
                                  label=""
                                  items={projects ?? []}
                                />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label="Remarks"
                            className={lineCellClass("md:w-40")}
                          >
                            <form.AppField name={`details[${i}].remarks`}>
                              {(field) => (
                                <field.Input label="" className="w-full" />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            className="
                          flex justify-end pt-2
                          md:table-cell md:w-11 md:px-2 md:py-1.5
                          md:text-center md:align-middle"
                          >
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
                      );
                    })}
                  </tbody>
                </table>
                {field.state.value?.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No lines added
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click &quot;Add Line&quot; to start adding items or
                      services.
                    </p>
                  </div>
                )}
                {field.state.value.length > 0 && (
                  <div className="flex items-center justify-between border-t px-5 py-3">
                    <p className="text-xs text-muted-foreground">
                      {field.state.value.length}{" "}
                      {field.state.value.length === 1 ? "line" : "lines"}
                    </p>

                    <Button
                      type="button"
                      onClick={addLine}
                      size="sm"
                      variant="link"
                      className="hover:no-underline hover:text-muted-foreground"
                    >
                      + Add another line
                    </Button>
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
