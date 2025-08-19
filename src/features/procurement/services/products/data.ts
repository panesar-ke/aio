'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { eq, or, sql } from 'drizzle-orm';
import {
  getProductIdTag,
  getProductsCategoryGlobalTag,
  getProductsGlobalTag,
  getUomGlobalTag,
} from '@/features/procurement/utils/cache';
import db from '@/drizzle/db';
import { productCategories, products, uoms } from '@/drizzle/schema';
import { transformOptions } from '@/lib/helpers/formatters';

export const getProducts = async (q?: string) => {
  cacheTag(getProductsGlobalTag());
  return db
    .select({
      id: products.id,
      productName: sql<string>`UPPER(${products.productName})`,
      unit: uoms.uom,
      category: productCategories.categoryName,
      active: products.active,
    })
    .from(products)
    .innerJoin(uoms, eq(products.uomId, uoms.id))
    .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(
      q
        ? or(
            sql`LOWER(${products.productName}) like ${`%${q.toLowerCase()}%`}`,
            sql`LOWER(${uoms.uom}) LIKE LOWER(${`%${q.toLowerCase()}%`})`,
            sql`LOWER(${
              productCategories.categoryName
            }) LIKE LOWER(${`%${q.toLowerCase()}%`})`
          )
        : undefined
    )
    .orderBy(sql`LOWER(${products.productName})`);
};

export const getCategories = async () => {
  cacheTag(getProductsCategoryGlobalTag());
  const categories = await db
    .select({
      id: productCategories.id,
      name: sql<string>`UPPER(${productCategories.categoryName})`,
    })
    .from(productCategories);

  return transformOptions(categories);
};

export const getProductUoms = async () => {
  cacheTag(getUomGlobalTag());
  const units = await db
    .select({
      id: uoms.id,
      name: sql<string>`UPPER(${uoms.uom})`,
    })
    .from(uoms);

  return transformOptions(units);
};

export const getProduct = async (id: string) => {
  cacheTag(getProductIdTag(id));

  return db.query.products.findFirst({
    where: (model, { eq }) => eq(model.id, id),
  });
};
