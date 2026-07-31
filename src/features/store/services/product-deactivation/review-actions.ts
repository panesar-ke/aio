"use server";

import { eq, inArray } from "drizzle-orm";

import db from "@/drizzle/db";
import { productDeactivationItems, products } from "@/drizzle/schema";
import { revalidateProductDeactivation } from "@/features/store/utils/cache";
import { requirePermission } from "@/lib/permissions/guards";
import { getCurrentUser } from "@/lib/session";

export async function reactivateItems(itemIds: Array<string>) {
  await requirePermission("store:admin", { mode: "action" });

  if (itemIds.length === 0) {
    return { error: true, message: "No items selected." };
  }

  try {
    const user = await getCurrentUser();

    const items = await db
      .select({
        productId: productDeactivationItems.productId,
        batchId: productDeactivationItems.batchId,
      })
      .from(productDeactivationItems)
      .where(inArray(productDeactivationItems.id, itemIds));

    await db.transaction(async (tx) => {
      await tx
        .update(productDeactivationItems)
        .set({
          reactivated: true,
          reactivatedBy: user.id,
          reactivatedOn: new Date(),
        })
        .where(inArray(productDeactivationItems.id, itemIds));

      await tx
        .update(products)
        .set({ active: true })
        .where(
          inArray(
            products.id,
            items.map((item) => item.productId),
          ),
        );
    });

    const batchIds = [...new Set(items.map((item) => item.batchId))];
    if (batchIds.length) {
      revalidateProductDeactivation();
    } else {
      for (const batchId of batchIds) {
        revalidateProductDeactivation(batchId);
      }
    }

    return {
      error: false,
      message: "Selected items reactivated successfully.",
    };
  } catch (error) {
    console.error("Error reactivating items:", error);
    return { error: true, message: "Failed to reactivate selected items." };
  }
}

export async function excludeProductFromAutoDeactivation(productId: string) {
  await requirePermission("store:admin", { mode: "action" });

  try {
    await db
      .update(products)
      .set({ excludeFromAutoDeactivation: true })
      .where(eq(products.id, productId));

    revalidateProductDeactivation();

    return { error: false, message: "Product excluded from future checks." };
  } catch (error) {
    console.error("Error excluding product:", error);
    return { error: true, message: "Failed to exclude product." };
  }
}
