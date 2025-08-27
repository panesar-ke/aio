'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import type { ProductsFormValues } from '@/features/procurement/utils/procurement.types';
import { productsSchema } from '@/features/procurement/utils/schemas';
import { products } from '@/drizzle/schema';
import db from '@/drizzle/db';
import { revalidateProducts } from '@/features/procurement/utils/cache';
import { validateFields } from '@/lib/action-validator';
import { getProduct } from '@/features/procurement/services/products/data';

export const createProduct = async (values: unknown) => {
  try {
    const { data, error } = validateFields<ProductsFormValues>(
      values,
      productsSchema
    );

    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const [{ id }] = await db
      .insert(products)
      .values({ ...data, categoryId: +data.categoryId, uomId: +data.uomId })
      .returning({ id: products.id });

    revalidateProducts(id);

    return {
      error: false,
      message: 'Product created successfully.',
      data: { id },
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      error: true,
      message: 'Failed to create product. Please try again.',
    };
  }
};

export const updateProduct = async (id: string, values: unknown) => {
  try {
    if (!id) {
      return {
        error: true,
        message: 'Product ID is required.',
      };
    }

    const { data, error } = validateFields<ProductsFormValues>(
      values,
      productsSchema
    );

    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const product = await getProduct(id);

    if (!product) {
      return {
        error: true,
        message: "Trying to edit a product that doesn't exist.",
      };
    }

    await db
      .update(products)
      .set({
        ...data,
        categoryId: +data.categoryId,
        uomId: +data.uomId,
        isPeace: data.subItem,
      })
      .where(eq(products.id, id));

    revalidateProducts(id);
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      error: true,
      message: 'Failed to update product. Please try again.',
    };
  }
  redirect('/procurement/products');
};

export const productIsReferenced = async (productId: string) => {
  const inOrders = await db.query.ordersDetails.findFirst({
    columns: { id: true },
    where: (model, { eq }) => eq(model.itemId, productId),
  });
  const inStock = await db.query.stockMovements.findFirst({
    columns: { id: true },
    where: (model, { eq }) => eq(model.itemId, productId),
  });

  return Boolean(inOrders) || Boolean(inStock);
};

export const deleteProduct = async (productId: string) => {
  try {
    if (!productId) {
      return {
        error: true,
        message: 'Product ID is required.',
      };
    }

    const isReferenced = await productIsReferenced(productId);

    if (isReferenced) {
      return {
        error: true,
        message: 'Product is referenced elsewhere and cannot be deleted.',
      };
    }

    await db.delete(products).where(eq(products.id, productId));
    revalidateProducts(productId);
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      error: true,
      message: 'Failed to delete product. Please try again.',
    };
  }
  redirect('/procurement/products');
};

export const toggleProductState = async (productId: string) => {
  try {
    if (!productId) {
      return {
        error: true,
        message: 'Product ID is required.',
      };
    }

    const product = await getProduct(productId);

    if (!product) {
      return {
        error: true,
        message: "Trying to edit a product that doesn't exist.",
      };
    }

    await db
      .update(products)
      .set({ active: !product.active })
      .where(eq(products.id, productId));
    revalidateProducts(productId);

    return {
      error: false,
      message: `Product ${
        product.active ? 'deactivated' : 'activated'
      } successfully.`,
    };
  } catch (error) {
    console.error('Error toggling product state:', error);
    return {
      error: true,
      message: 'Failed to update product state. Please try again.',
    };
  }
};
