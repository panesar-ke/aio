import type { Option } from "@/types/index.types";

import { FieldGroup } from "@/components/ui/field";
import { SelectItem } from "@/components/ui/select";
import { useProcurementServices } from "@/features/procurement/hooks/use-procurement-services";
import { purchaseOrderFormOpts } from "@/features/procurement/utils/form";
import { withForm } from "@/lib/form";

export const OrderFormHeader = withForm({
  ...purchaseOrderFormOpts(),
  props: {
    vendors: [] as Array<Option>,
  },
  render: function Render({ form, vendors: initialVendors }) {
    const { vendors } = useProcurementServices({
      vendors: initialVendors,
      include: ["vendors"],
    });

    return (
      <section className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">
            Order Header
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vendor and document details for this order.
          </p>
        </div>
        <FieldGroup className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <form.AppField name="documentNo">
            {(field) => <field.Input label="Order No" readOnly />}
          </form.AppField>
          <form.AppField name="documentDate">
            {(field) => <field.Input label="Date" type="date" required />}
          </form.AppField>
          <form.AppField name="vendor">
            {(field) => (
              <field.Combobox
                label="Vendor"
                required
                items={vendors ?? initialVendors}
                placeholder="Select vendor"
                searchPlaceholder="Search vendors"
                emptyMessage="No vendors found"
              />
            )}
          </form.AppField>
          <form.AppField name="invoiceNo">
            {(field) => (
              <field.Input label="Invoice No" placeholder="e.g. INV-88213" />
            )}
          </form.AppField>
          <form.AppField name="invoiceDate">
            {(field) => <field.Input label="Invoice Date" type="date" />}
          </form.AppField>
          <div className="hidden lg:block" aria-hidden="true" />
          <form.AppField
            name="vatType"
            listeners={{
              onChange: ({ value, fieldApi }) => {
                if (value === "NONE") {
                  fieldApi.form.setFieldValue("vat", "");
                }
              },
            }}
          >
            {(field) => (
              <field.Select
                label="VAT Type"
                required
                placeholder="Select VAT Type"
              >
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="INCLUSIVE">Inclusive</SelectItem>
                <SelectItem value="EXCLUSIVE">Exclusive</SelectItem>
              </field.Select>
            )}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.vatType}>
            {(vatType) => (
              <form.AppField name="vat">
                {(field) => (
                  <field.Select
                    label="VAT Rate"
                    required={vatType !== "NONE"}
                    disabled={vatType === "NONE"}
                    placeholder="Select VAT"
                  >
                    <SelectItem value="16">16%</SelectItem>
                    <SelectItem value="8">8%</SelectItem>
                  </field.Select>
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </FieldGroup>
      </section>
    );
  },
});
