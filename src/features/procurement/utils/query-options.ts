import { queryOptions } from '@tanstack/react-query'
import {
  getMaterialRequisitions,
  getRequisition,
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from '@/features/procurement/services/server-fns'

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
}

export const materialRequisitionsQueryOptions = {
  all: () =>
    queryOptions({
      queryKey: ['material_requisitions'],
      queryFn: getMaterialRequisitions,
    }),
  requisition: (id: string) =>
    queryOptions({
      queryKey: ['material_requisitions', id],
      queryFn: () => getRequisition({ data: id }),
    }),
}
