import { and, asc, eq, lte, gte, sql, or, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type {
  OrderByCriteriaFormValues,
  OrderRegisterFormValues,
  TopVendorFormValues,
} from '@/features/procurement/utils/procurement.types';
import { validateFields } from '@/lib/action-validator';
import {
  orderByCriteriaSchema,
  orderRegisterSchema,
  topVendorsSchema,
} from '@/features/procurement/utils/schemas';
import db from '@/drizzle/db';
import {
  ordersDetails,
  ordersHeader,
  products,
  services,
  vendors,
  projects,
} from '@/drizzle/schema';

function getFilters(from: string, to: string, vendorId: string): Array<SQL> {
  const filters: Array<SQL> = [];
  filters.push(gte(ordersHeader.documentDate, from));
  filters.push(lte(ordersHeader.documentDate, to));

  if (vendorId !== 'all') {
    filters.push(eq(ordersHeader.vendorId, vendorId));
  }

  return filters;
}

export const orderRegisterReport = async (values: unknown) => {
  const { data, error } = validateFields<OrderRegisterFormValues>(
    values,
    orderRegisterSchema
  );
  if (error !== null) {
    return {
      error:
        'Invalid report parameters set. Ensure you have set valid report params',
      data: null,
    };
  }

  const { from, to, reportType, vendorId } = data;

  const report =
    reportType === 'summary' ? orderRegisterSummary : orderRegisterByItems;

  return {
    error: null,
    data: await report(from, to, vendorId),
  };
};

const orderRegisterSummary = async (
  from: string,
  to: string,
  vendorId: string
) => {
  return await db
    .select({
      id: ordersHeader.id,
      documentDate: ordersHeader.documentDate,
      billDate: ordersHeader.billDate,
      vendorName: sql<string>`UPPER(${vendors.vendorName})`,
      billNo: ordersHeader.billNo,
      totalDiscount: sql<number>`COALESCE(SUM(${ordersDetails.discountedAmount}),0)`,
      subTotal: sql<number>`COALESCE(SUM(${ordersDetails.amountExclusive}),0)`,
      vat: sql<number>`COALESCE(SUM(${ordersDetails.vat}),0)`,
      totalAmount: sql<number>`SUM(${ordersDetails.amountInclusive})`,
    })
    .from(ordersHeader)
    .where(and(...getFilters(from, to, vendorId)))
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .groupBy(
      ordersHeader.id,
      ordersHeader.billDate,
      vendors.vendorName,
      ordersHeader.billNo
    )
    .orderBy(asc(ordersHeader.billDate));
};

export const orderRegisterByItems = async (
  from: string,
  to: string,
  vendorId: string
) => {
  return await db
    .select({
      id: ordersHeader.id,
      documentDate: ordersHeader.documentDate,
      billDate: ordersHeader.billDate,
      vendorName: sql<string>`UPPER(${vendors.vendorName})`,
      billNo: ordersHeader.billNo,
      itemName: sql<string>`UPPER(CASE WHEN ${ordersDetails.itemId} IS NULL THEN ${services.serviceName} ELSE ${products.productName} END)`,
      quantity: ordersDetails.qty,
      unitPrice: ordersDetails.rate,
      discount: ordersDetails.discountedAmount,
      totalPrice: ordersDetails.amountExclusive,
    })
    .from(ordersHeader)
    .where(and(...getFilters(from, to, vendorId)))
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .leftJoin(products, eq(ordersDetails.itemId, products.id))
    .leftJoin(services, eq(ordersDetails.serviceId, services.id))
    .orderBy(asc(ordersHeader.billDate), asc(ordersHeader.documentDate));
};

export const orderByProject = async (
  from: string,
  to: string,
  projectId: string
) => {
  return await db
    .select({
      id: ordersHeader.id,
      itemName: sql<string>`UPPER(CASE WHEN ${ordersDetails.itemId} IS NULL THEN ${services.serviceName} ELSE ${products.productName} END)`,
      documentDate: sql<string>`COALESCE(${ordersHeader.billDate}, ${ordersHeader.documentDate})`,
      qty: ordersDetails.qty,
      discount: ordersDetails.discountedAmount,
      subTotal: ordersDetails.amountExclusive,
      vat: ordersDetails.vat,
      totalAmount: ordersDetails.amountInclusive,
    })
    .from(ordersHeader)
    .where(
      and(
        gte(ordersHeader.documentDate, from),
        lte(ordersHeader.documentDate, to),
        eq(ordersDetails.projectId, projectId)
      )
    )
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .leftJoin(products, eq(ordersDetails.itemId, products.id))
    .leftJoin(services, eq(ordersDetails.serviceId, services.id))
    .orderBy(asc(ordersHeader.billDate), asc(ordersHeader.documentDate));
};

export const orderByProduct = async (
  from: string,
  to: string,
  productId: string
) => {
  return await db
    .select({
      id: ordersHeader.id,
      itemName: sql<string>`UPPER(CASE WHEN ${ordersDetails.itemId} IS NULL THEN ${services.serviceName} ELSE ${products.productName} END)`,
      documentDate: sql<string>`COALESCE(${ordersHeader.billDate}, ${ordersHeader.documentDate})`,
      project: sql<string>`UPPER(${projects.projectName})`,
      qty: ordersDetails.qty,
      rate: ordersDetails.rate,
      discount: ordersDetails.discountedAmount,
      subTotal: ordersDetails.amountExclusive,
      vat: ordersDetails.vat,
      totalAmount: ordersDetails.amountInclusive,
    })
    .from(ordersHeader)
    .where(
      and(
        gte(ordersHeader.documentDate, from),
        lte(ordersHeader.documentDate, to),
        or(
          eq(ordersDetails.itemId, productId),
          eq(ordersDetails.serviceId, productId)
        )
      )
    )
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .innerJoin(projects, eq(ordersDetails.projectId, projects.id))
    .leftJoin(products, eq(ordersDetails.itemId, products.id))
    .leftJoin(services, eq(ordersDetails.serviceId, services.id))
    .orderBy(asc(ordersHeader.billDate), asc(ordersHeader.documentDate));
};

export const orderByCriteria = async (values: unknown) => {
  const { error, data } = validateFields<OrderByCriteriaFormValues>(
    values,
    orderByCriteriaSchema
  );
  if (error !== null) {
    return {
      error:
        'Invalid report parameters set. Ensure you have set valid report params',
      data: null,
    };
  }
  const { from, to, criteria, option } = data;

  const report = criteria === 'project' ? orderByProject : orderByProduct;

  return {
    error: null,
    data: await report(from, to, option),
  };
};

export const getTopVendors = async (values: unknown) => {
  const { error, data } = validateFields<TopVendorFormValues>(
    values,
    topVendorsSchema
  );
  if (error !== null) {
    return {
      error:
        'Invalid report parameters set. Ensure you have set valid report params',
      data: null,
    };
  }

  const { from, to, criteria, top } = data;

  const topVendors = await db
    .select({
      vendorName: sql<string>`UPPER(${vendors.vendorName})`,
      totalAmount: sql<number>`SUM(${ordersDetails.amountInclusive})`,
      discountedAmount: sql<number>`SUM(${ordersDetails.discountedAmount})`,
    })
    .from(ordersHeader)
    .where(
      and(
        gte(ordersHeader.documentDate, from),
        lte(ordersHeader.documentDate, to)
      )
    )
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .groupBy(vendors.vendorName)
    .orderBy(
      criteria === 'discount'
        ? desc(sql`SUM(${ordersDetails.discountedAmount})`)
        : desc(sql`SUM(${ordersDetails.amountInclusive})`)
    )
    .limit(+top);

  return { error: null, data: topVendors };
};
