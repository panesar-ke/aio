import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/cache';

export function getLeadsGlobalTag() {
  return getGlobalTag('leads');
}
export function getLeadIdTag(id: string) {
  return getIdTag('leads', id);
}

export function getAccountsGlobalTag() {
  return getGlobalTag('accounts');
}
export function getAccountIdTag(id: string) {
  return getIdTag('accounts', id);
}

export function getSalesOrdersGlobalTag() {
  return getGlobalTag('sales-orders');
}
export function getSalesOrdersIdTag(id: string) {
  return getIdTag('sales-orders', id);
}

export function getSalesPersonsGlobalTag() {
  return getGlobalTag('sales-persons');
}

export function revalidateLeadsTag(id: string) {
  revalidateTag(getLeadsGlobalTag(), 'max');
  revalidateTag(getLeadIdTag(id), 'max');
}

export function revalidateAccountsTag(id: string) {
  revalidateTag(getAccountsGlobalTag(), 'max');
  revalidateTag(getAccountIdTag(id), 'max');
}

export function revalidateSalesOrderTag(id: string) {
  revalidateTag(getSalesOrdersGlobalTag(), 'max');
  revalidateTag(getSalesOrdersIdTag(id), 'max');
  revalidateTag(getSalesPersonsGlobalTag(), 'max');
}
