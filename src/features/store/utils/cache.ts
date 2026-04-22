import { getGlobalTag, getIdTag } from '@/lib/cache';
import { dateFormat } from '@/lib/helpers/formatters';
import { revalidateTag } from 'next/cache';

export const getStoresGlobalTag = () => {
  return getGlobalTag('stores');
};

export const getStoresIdTag = (id: string) => {
  return getIdTag('stores', id);
};

export const getGrnsGlobalTag = () => {
  return getGlobalTag('grns');
};

export const getGrnsIdTag = (id: string) => {
  return getIdTag('grns', id);
};

export const getGrnsNoTag = () => {
  return getGlobalTag('grn number');
};

export const getUnreceivedGrnsGlobal = () => {
  return getGlobalTag('unreceived orders');
};

export const getProductStockBalanceTags = (
  productId: string,
  storeId: string,
  date: Date
) => {
  return `product:'-${productId}-${storeId}-${dateFormat(date)}`;
};

export const getTransfersGlobalTag = () => {
  return getGlobalTag('transfers');
};

export const getTransfersIdTag = (id: string) => {
  return getIdTag('transfers', id);
};

export const getMaterialIssuesGlobalTag = () => {
  return getGlobalTag('material issues');
};

export const getMaterialIssuesIdTag = (id: string) => {
  return getIdTag('material issues', id);
};

export const getMaterialIssueNo = () => {
  return getGlobalTag('material issue no');
};

export const revalidateStoresTag = (id: string) => {
  revalidateTag(getStoresGlobalTag(), 'max');
  revalidateTag(getStoresIdTag(id), 'max');
};

export const revalidateGrnsTag = (id: string) => {
  revalidateTag(getGrnsGlobalTag(), 'max');
  revalidateTag(getGrnsIdTag(id), 'max');
  revalidateTag(getGrnsNoTag(), 'max');
  revalidateTag(getUnreceivedGrnsGlobal(), 'max');
  revalidateTag('stock-balance', 'max');
};

export const revalidateTransfersTag = (id: string) => {
  revalidateTag(getTransfersGlobalTag(), 'max');
  revalidateTag(getTransfersIdTag(id), 'max');
  revalidateTag('stock-balance', 'max');
};

export const revalidateMaterialsIssues = (id: string) => {
  revalidateTag(getMaterialIssuesGlobalTag(), 'max');
  revalidateTag(getMaterialIssuesIdTag(id), 'max');
  revalidateTag(getMaterialIssueNo(), 'max');
};
