import { queryOptions } from '@tanstack/react-query';
import {
  getMaterialRequisitions,
  getRequisition,
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/material-requisitions/data';

export const globalOptions = {
  selectableProjects: () =>
    queryOptions({
      queryKey: ['projects', 'selectable'],
      queryFn: getSelectableProjects,
    }),
  selectableProducts: () =>
    queryOptions({
      queryKey: ['products', 'selectable'],
      queryFn: getSelectableProducts,
    }),
  selectableServices: () =>
    queryOptions({
      queryKey: ['services', 'selectable'],
      queryFn: getSelectableServices,
    }),
};

export const materialRequisitionsQueryOptions = {
  all: () =>
    queryOptions({
      queryKey: ['material_requisitions'],
      queryFn: getMaterialRequisitions,
    }),
  requisition: (id: string) =>
    queryOptions({
      queryKey: ['material_requisitions', id],
      queryFn: () => getRequisition(id),
    }),
};

// export const purchaseOrdersQueryOptions = {
//   all: (q?: string) =>
//     queryOptions({
//       queryKey: ['purchase_orders', q],
//       queryFn: () => getPurchaseOrders({ data: q }),
//     }),
//   order: (id: string) =>
//     queryOptions({
//       queryKey: ['purchase_orders', id],
//       queryFn: () => getPurchaseOrder({ data: id }),
//     }),
//   pendingOrders: () =>
//     queryOptions({ queryKey: ['pending_orders'], queryFn: getPendingRequests }),
//   activeVendors: () =>
//     queryOptions({
//       queryKey: ['vendors', 'active'],
//       queryFn: getActiveVendors,
//     }),
// }
