import { getGlobalTag, getIdTag } from '@/lib/cache';
import { revalidateTag } from 'next/cache';

export const getStoresGlobalTag = () => {
  return getGlobalTag('stores');
};

export const getStoresIdTag = (id: string) => {
  return getIdTag('stores', id);
};

export const revalidateStoresTag = (id: string) => {
  revalidateTag(getStoresGlobalTag());
  revalidateTag(getStoresIdTag(id));
};
