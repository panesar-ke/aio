import { revalidateTag } from 'next/cache';
import { getGlobalTag, getIdTag } from '@/lib/cache';

export function getMaterialRequisitionNoGlobalTag() {
  return getGlobalTag('material-requisition-no');
}

export function getMaterialRequisitionGlobalTag() {
  return getGlobalTag('material-requisitions');
}

export function getMaterialRequisitionIdTag(id: string) {
  return getIdTag('material-requisitions', id);
}

export function getProductsCategoryGlobalTag() {
  return getGlobalTag('categories');
}

export function getUomGlobalTag() {
  return getGlobalTag('uoms');
}

export function getProductsGlobalTag() {
  return getGlobalTag('products');
}
export function getProductIdTag(id: string) {
  return getIdTag('products', id);
}

export function getServicesGlobalTag() {
  return getGlobalTag('services');
}

export function getServiceIdTag(id: string) {
  return getIdTag('services', id);
}

export function getProjectsGlobalTag() {
  return getGlobalTag('projects');
}

export function getAutoOrdersGlobalTag() {
  return getGlobalTag('auto-orders');
}

export function getVendorsGlobalTag() {
  return getGlobalTag('vendors');
}

export function getVendorIdTag(id: string) {
  return getIdTag('vendors', id);
}

export function getVendorStatsGlobalTag() {
  return getGlobalTag('vendors_stats');
}

export function revalidateMaterialRequisitions(id?: string) {
  if (id) {
    revalidateTag(getMaterialRequisitionIdTag(id));
  }
  revalidateTag(getMaterialRequisitionGlobalTag());
  revalidateTag(getMaterialRequisitionNoGlobalTag());
}

export function getPurchaseOrderNoGlobalTag() {
  return getGlobalTag('purchase-order-no');
}

export function getPurchaseOrdersGlobalTag() {
  return getGlobalTag('purchase-orders');
}

export function getPendingRequestsGlobalTag() {
  return getGlobalTag('pending-requests');
}

export function getPurchaseOrderIdTag(id: string) {
  return getIdTag('purchase-orders', id);
}

export function revalidatePurchaseOrders(id?: string) {
  if (id) {
    revalidateTag(getPurchaseOrderIdTag(id));
  }
  revalidateTag(getPurchaseOrdersGlobalTag());
  revalidateTag(getPurchaseOrderNoGlobalTag());
  revalidateTag(getPendingRequestsGlobalTag());
  revalidateTag(getVendorStatsGlobalTag());
}

export function revalidateVendors(id: string) {
  revalidateTag(getVendorsGlobalTag());
  revalidateTag(getVendorIdTag(id));
  revalidateTag(getVendorStatsGlobalTag());
}

export const revalidateProducts = (id: string) => {
  revalidateTag(getProductIdTag(id));
  revalidateTag(getProductsGlobalTag());
};

export const revalidateServices = (id: string) => {
  revalidateTag(getServiceIdTag(id));
  revalidateTag(getServicesGlobalTag());
};

export const revalidateAutoOrder = () => {
  revalidateTag(getAutoOrdersGlobalTag());
};
