'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Option } from '@/types/index.types';
import type {
  ProductsFormValues,
  Product,
} from '@/features/procurement/utils/procurement.types';
import { productsSchema } from '@/features/procurement/utils/schemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MiniSelect } from '@/components/custom/mini-select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormActions } from '@/components/custom/form-actions';
import {
  createProduct,
  updateProduct,
} from '@/features/procurement/services/products/actions';
import { ToastContent } from '@/components/custom/toast';
import { useModal } from '@/features/integrations/modal-provider';
import { cn } from '@/lib/utils';

interface ProductsFormProps {
  categories: Array<Option>;
  units: Array<Option>;
  fromModal?: boolean;
  product?: Product;
}

export function ProductsForm({
  categories,
  units,
  fromModal,
  product,
}: ProductsFormProps) {
  const form = useForm<ProductsFormValues>({
    defaultValues: {
      productName: product?.productName.toUpperCase() || '',
      categoryId: product?.categoryId?.toString() || '',
      uomId: product?.uomId?.toString() || '',
      buyingPrice: product?.buyingPrice?.toString() || '0',
      stockItem: product?.stockItem || true,
      subItem: product?.isPeace || false,
      active: product?.active || true,
    },
    resolver: zodResolver(productsSchema),
  });
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setClose } = useModal();

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: ProductsFormValues) {
    const action = product
      ? updateProduct.bind(null, product.id)
      : createProduct;
    const res = await action(values);
    if (res?.error) {
      toast.error(() => (
        <ToastContent message={res.message} title="Error saving product" />
      ));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    if (!fromModal && !product) {
      router.push('/procurement/products');
    }
    if (fromModal && !product) {
      setClose();
    }
  }

  return (
    <div className={cn({ 'bg-card p-6 rounded-lg shadow-sm': !fromModal })}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter product name" />
                </FormControl>
                <FormDescription>
                  Search for existing products first to avoid duplicates in the
                  product list.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={categories}
                    placeholder="Select a category"
                    defaultValue={field.value}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uomId"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Unit of Measure</FormLabel>
                <FormControl>
                  <MiniSelect
                    options={units}
                    placeholder="Select a unit"
                    defaultValue={field.value}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ''}
                    placeholder="Enter buying price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockItem"
            render={({ field }) => (
              <FormItem className="col-span-full flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Is Stock Item</FormLabel>
                {!fromModal && (
                  <FormDescription>
                    Check this box if the product is a stock item and should be
                    displayed in stock reports.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subItem"
            render={({ field }) => (
              <FormItem className="col-span-full flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Is Sub Item</FormLabel>
                {!fromModal && (
                  <FormDescription>
                    Check this box if the product is a sub item of another
                    product.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {product && (
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="col-span-full flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    {!field.value
                      ? 'Check if the product is active.'
                      : 'Uncheck if the product is inactive.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormActions
            className="col-span-full"
            resetFn={() => {
              form.reset();
              if (fromModal && !product) {
                setClose();
              }
            }}
            isPending={isPending}
          />
        </form>
      </Form>
    </div>
  );
}
