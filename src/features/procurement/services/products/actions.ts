"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import type { ProductsFormValues } from "@/features/procurement/utils/procurement.types";

import db from "@/drizzle/db";
import { products } from "@/drizzle/schema";
import { getProduct } from "@/features/procurement/services/products/data";
import { revalidateProducts } from "@/features/procurement/utils/cache";
import { productsSchema } from "@/features/procurement/utils/schemas";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import {
  toNullableString,
  toNullishNumber,
  toNumber,
} from "@/lib/helpers/numbers";
import { requireAnyPermission } from "@/lib/permissions/guards";
import { normalizeString } from "@/lib/string-normalizers";

function buildProductPayload(data: ProductsFormValues) {
  return {
    productName: normalizeString(data.productName),
    categoryId: toNumber(data.categoryId),
    uomId: toNullishNumber(data.uomId),
    isPeace: data.subItem,
    buyingPrice: toNullableString(data.buyingPrice),
    active: data.id ? data.active : true,
    excludeFromAutoDeactivation: data.excludeFromAutoDeactivation,
    stockItem: toNumber(data.categoryId) === 4 ? false : data.stockItem,
  };
}

export const upsertProduct = async (values: unknown) =>
  runAction("upsertProduct", async () => {
    await requireAnyPermission([
      "procurement:admin",
      "procurement:standard",
      "store:admin",
      "store:standard",
    ]);

    const data = parseOrFail(productsSchema, values);
    const payload = buildProductPayload(data);

    if (data.id) {
      const product = await getProduct(data.id);

      if (!product) {
        return {
          error: true,
          message: "Trying to edit a product that doesn't exist.",
        };
      }
    }

    try {
      const returnedId = await db.transaction(async (tx) => {
        let productId;
        if (data.id) {
          productId = data.id;
          await tx
            .update(products)
            .set(payload)
            .where(eq(products.id, data.id));
        } else {
          const [{ id }] = await tx
            .insert(products)
            .values({ ...payload, active: true })
            .returning({ id: products.id });

          productId = id;
        }

        return productId;
      });

      revalidateProducts(returnedId);

      return {
        error: false,
        message: `Product ${data.id ? "updated" : "created"} successfully.`,
      };
    } catch (e) {
      console.log(e);
      return {
        error: true,
        message: data.id
          ? "Unable to update product"
          : "Unable to create product",
      };
    }
  });

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
  await requireAnyPermission(["procurement:admin", "store:admin"]);
  try {
    if (!productId) {
      return {
        error: true,
        message: "Product ID is required.",
      };
    }

    const isReferenced = await productIsReferenced(productId);

    if (isReferenced) {
      return {
        error: true,
        message: "Product is referenced elsewhere and cannot be deleted.",
      };
    }

    await db.delete(products).where(eq(products.id, productId));
    revalidateProducts(productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      error: true,
      message: "Failed to delete product. Please try again.",
    };
  }
  redirect("/procurement/products");
};

export const toggleProductState = async (productId: string) => {
  await requireAnyPermission([
    "procurement:admin",
    "procurement:standard",
    "store:admin",
    "store:standard",
  ]);

  try {
    if (!productId) {
      return {
        error: true,
        message: "Product ID is required.",
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
        product.active ? "deactivated" : "activated"
      } successfully.`,
    };
  } catch (error) {
    console.error("Error toggling product state:", error);
    return {
      error: true,
      message: "Failed to update product state. Please try again.",
    };
  }
};
