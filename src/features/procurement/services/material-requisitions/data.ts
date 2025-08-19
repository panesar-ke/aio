'use cache';
import { and, asc, desc, eq } from 'drizzle-orm';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import db from '@/drizzle/db';
import { mrqHeaders, products, projects, services } from '@/drizzle/schema';
import { transformOptions } from '@/lib/helpers/formatters';
import {
  getMaterialRequisitionGlobalTag,
  getMaterialRequisitionIdTag,
  getProductsGlobalTag,
  getServicesGlobalTag,
  getProjectsGlobalTag,
} from '@/features/procurement/utils/cache';

export const getMaterialRequisitions = cache(async () => {
  cacheTag(getMaterialRequisitionGlobalTag());
  const requisitions = await db.query.mrqHeaders.findMany({
    where: (model, { eq: equal }) => equal(model.isDeleted, false),
    with: {
      user: { columns: { id: true, name: true } },
      mrqDetails: { columns: { linked: true } },
    },
    orderBy: (model, { desc }) => desc(model.createdOn),
    limit: 100,
  });

  return requisitions.map(req => ({
    ...req,
    linked: req.mrqDetails.some(detail => detail.linked),
  }));
});

export const getSelectableProducts = async () => {
  cacheTag(getProductsGlobalTag());
  const dbProducts = await db
    .select({
      id: products.id,
      name: products.productName,
    })
    .from(products)
    .where(and(eq(products.active, true)))
    .orderBy(asc(products.productName));

  return transformOptions(dbProducts);
};

export const getSelectableServices = async () => {
  cacheTag(getServicesGlobalTag());
  const dbServices = await db
    .select({
      id: services.id,
      name: services.serviceName,
    })
    .from(services)
    .where(and(eq(services.active, true)))
    .orderBy(asc(services.serviceName));

  return transformOptions(dbServices);
};

export const getSelectableProjects = async () => {
  cacheTag(getProjectsGlobalTag());
  const dbProjects = await db
    .select({
      id: projects.id,
      name: projects.projectName,
    })
    .from(projects)
    .where(eq(projects.active, true))
    .orderBy(asc(projects.projectName));

  return transformOptions(dbProjects);
};

export const getRequisitionNo = async () => {
  const lastMrq = await db
    .select({
      documentNo: mrqHeaders.id,
    })
    .from(mrqHeaders)
    .orderBy(desc(mrqHeaders.id))
    .limit(1);

  if (!lastMrq.length) return 1;
  return lastMrq[0].documentNo + 1;
};

export const getRequisition = async (id: string) => {
  cacheTag(getMaterialRequisitionIdTag(id));
  const requisition = await db.query.mrqHeaders.findFirst({
    where: (model, { eq: equal }) => equal(model.reference, id),
    with: {
      mrqDetails: {
        with: {
          product: {
            columns: { id: true, productName: true, buyingPrice: true },
            with: { uom: { columns: { abbreviation: true } } },
          },
          service: {
            columns: { id: true, serviceName: true, serviceFee: true },
          },
          project: { columns: { id: true, projectName: true } },
        },
      },
    },
  });

  if (!requisition) {
    notFound();
  }

  return requisition;
};
