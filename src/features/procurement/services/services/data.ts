'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import {
  getServiceIdTag,
  getServicesGlobalTag,
} from '@/features/procurement/utils/cache';
import db from '@/drizzle/db';

export const serviceIsReferenced = async (serviceId: string) => {
  const inOrders = await db.query.ordersDetails.findFirst({
    columns: { id: true },
    where: (model, { eq }) => eq(model.serviceId, serviceId),
  });
  return Boolean(inOrders);
};

export const getServices = async (q?: string) => {
  cacheTag(getServicesGlobalTag());
  return await db.query.services.findMany({
    where: (model, { ilike }) =>
      q ? ilike(model.serviceName, `%${q}%`) : undefined,
  });
};

export const getService = async (id: string) => {
  cacheTag(getServiceIdTag(id));
  return await db.query.services.findFirst({
    where: (model, { eq }) => eq(model.id, id),
  });
};
