import { getGlobalTag, getIdTag } from '@/lib/cache';
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

export const revalidateStoresTag = (id: string) => {
  revalidateTag(getStoresGlobalTag());
  revalidateTag(getStoresIdTag(id));
};

export const revalidateGrnsTag = (id: string) => {
  revalidateTag(getGrnsGlobalTag());
  revalidateTag(getGrnsIdTag(id));
  revalidateTag(getGrnsNoTag());
  revalidateTag(getUnreceivedGrnsGlobal());
};
