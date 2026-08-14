'use client';

import type { ChangeEvent } from 'react';

import { useSelector } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { products } from '@/drizzle/schema';
import type {
  Product,
  ProductsFormValues,
} from '@/features/procurement/utils/procurement.types';
import type { Option } from '@/types/index.types';

import { FooterFormActions } from '@/components/custom/form-actions';
import { FormSectionHeader } from '@/components/custom/form-header';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectItem } from '@/components/ui/select';
import { useModal } from '@/features/integrations/modal-provider';
import { productsSchema } from '@/features/procurement/utils/schemas';
import { useAppForm } from '@/lib/form';
import { handleSubmitFeedback } from '@/lib/form-submit-feedback';
import { toNullableNumber } from '@/lib/helpers/numbers';
import { cn } from '@/lib/utils';

import { upsertProduct } from '../../services/products/actions';

function buildProductDefaultValues(
  product?: typeof products.$inferSelect,
): ProductsFormValues {
  if (product) {
    return {
      id: product.id,
      active: product.active ?? true,
      categoryId: product.categoryId.toString(),
      productName: product.productName,
      subItem: product.isPeace ?? false,
      stockItem: product.stockItem ?? true,
      uomId: product.uomId?.toString() ?? '',
      buyingPrice: product.buyingPrice ? Number(product.buyingPrice) : null,
      openingBalance: null,
      excludeFromAutoDeactivation: product.excludeFromAutoDeactivation ?? false,
    } satisfies ProductsFormValues;
  }
  return {
    id: null,
    active: true,
    categoryId: '',
    productName: '',
    subItem: false,
    stockItem: true,
    uomId: '',
    buyingPrice: 0,
    openingBalance: null,
    excludeFromAutoDeactivation: false,
  } satisfies ProductsFormValues;
}

interface ProductsFormProps {
  categories: Array<Option>;
  units: Array<Option>;
  fromModal?: boolean;
  product?: Product;
}

function handleNullableNumberChange(
  field: { handleChange: (value: number | null) => void },
  event: ChangeEvent<HTMLInputElement>,
) {
  field.handleChange(toNullableNumber(event.target.value));
}

export function ProductsForm({
  categories,
  units,
  fromModal,
  product,
}: ProductsFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setClose } = useModal();

  const form = useAppForm({
    defaultValues: buildProductDefaultValues(product),
    validators: {
      onSubmit: productsSchema,
    },
    onSubmit: async ({ value }) => {
      await handleSubmitFeedback({
        action: () => upsertProduct(value),
        errorTitle: `Error ${isEdit ? 'updating' : 'creating'} product`,
        successTitle: `✅ ${isEdit ? 'Updated' : 'Created'}`,
        fallbackMessage: `Failed to ${isEdit ? 'update' : 'create'} product. Please try again.`,
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: ['products'] });
          if (!fromModal) {
            router.push('/procurement/products');
          } else {
            setClose();
          }
        },
      });
    },
  });

  const isEdit = !!product;

  const [isSubmitting, isStockItem, categoryId] = useSelector(
    form.store,
    (state) => [
      state.isSubmitting,
      state.values.stockItem,
      state.values.categoryId,
    ],
  );

  return (
    <div
      className={cn({
        'flex min-h-0 flex-1 flex-col': !fromModal,
      })}
    >
      <form
        className={cn({ 'space-y-6': fromModal })}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup
          className={cn('', {
            'grid gap-6 md:grid-cols-3': !fromModal,
            'bg-card rounded-lg shadow-sm border p-6': fromModal,
          })}
        >
          <FieldSet
            className={cn('', {
              'md:col-span-2 bg-card rounded-lg shadow-sm border pb-6 self-start':
                !fromModal,
            })}
          >
            {!fromModal && (
              <FormSectionHeader
                title='Product Details'
                description='Basic information about the product.'
              />
            )}
            <FieldGroup className={cn({ 'px-6': !fromModal })}>
              <form.AppField name='productName'>
                {(field) => (
                  <field.Input
                    label='Product Name'
                    placeholder='Name of the product'
                  />
                )}
              </form.AppField>
            </FieldGroup>
            <FieldGroup
              className={cn('grid md:grid-cols-2 gap-6 ', {
                'px-6': !fromModal,
              })}
            >
              <form.AppField name='categoryId'>
                {(field) => (
                  <field.Select label='Category' placeholder='Select Category'>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </form.AppField>
              <form.AppField name='uomId'>
                {(field) => (
                  <field.Select label='Unit' placeholder='Select Unit'>
                    {units.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </form.AppField>
            </FieldGroup>
            <FieldGroup className={cn({ 'px-6': !fromModal })}>
              <form.AppField name='buyingPrice'>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Buying Price</FieldLabel>
                      <Input
                        id={field.name}
                        aria-invalid={isInvalid}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          handleNullableNumberChange(field, event)
                        }
                        placeholder='Price of the product'
                        type='number'
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.AppField>
            </FieldGroup>
          </FieldSet>
          {fromModal && <FieldSeparator />}
          <FieldSet
            className={cn('', {
              'bg-card rounded-lg shadow-sm border self-start pb-6': !fromModal,
            })}
          >
            {!fromModal && (
              <FormSectionHeader
                title='Behaviour Flags'
                description='Control how this product is tracked and managed across the system.'
              />
            )}

            <FieldGroup
              className={cn({
                'px-6': !fromModal,
                'grid grid-cols-2 gap-6': fromModal,
              })}
            >
              <form.AppField name='active'>
                {(field) => <field.Checkbox label='Active' />}
              </form.AppField>
              <form.AppField
                name='stockItem'
                listeners={{
                  onChange: ({ fieldApi }) => {
                    if (!fieldApi.state.value) {
                      fieldApi.form.setFieldValue(
                        'excludeFromAutoDeactivation',
                        false,
                      );
                    }
                  },
                }}
              >
                {(field) => (
                  <field.Checkbox
                    label='Stock Item'
                    disabled={+categoryId === 4}
                  />
                )}
              </form.AppField>
              <form.AppField name='excludeFromAutoDeactivation'>
                {(field) => (
                  <field.Checkbox
                    label='Exclude from auto deactivation'
                    disabled={!isStockItem}
                  />
                )}
              </form.AppField>
              <form.AppField name='subItem'>
                {(field) => <field.Checkbox label='Sub Item' />}
              </form.AppField>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        {fromModal && (
          <form.AppForm>
            <form.SubmitButton
              icon={<SaveIcon />}
              withReset
              buttonText='Create Product'
              onReset={() => {
                form.reset();
                setClose();
              }}
            />
          </form.AppForm>
        )}
      </form>
      {!fromModal && (
        <FooterFormActions
          withMarginTop
          handleReset={form.reset}
          saveText={isEdit ? 'Update Product' : 'Save Product'}
          handleSubmit={() => form.handleSubmit()}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
