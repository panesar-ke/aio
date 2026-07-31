import { useQueries } from '@tanstack/react-query';

import type { Option } from '@/types/index.types';

import {
  productsQueryOptions,
  projectsQueryOptions,
  servicesQueryOptions,
  vendorsQueryOptions,
} from '@/features/procurement/services/query-options';

type ProcurementServiceResource = 'products' | 'services' | 'projects' | 'vendors';

const ALL_RESOURCES: ReadonlyArray<ProcurementServiceResource> = [
  'products',
  'services',
  'projects',
  'vendors',
];

interface UseProcurementServicesOptions {
  products?: Array<Option>;
  services?: Array<Option>;
  projects?: Array<Option>;
  vendors?: Array<Option>;
  /** Restrict which resources are fetched — defaults to all four. */
  include?: ReadonlyArray<ProcurementServiceResource>;
}

export const useProcurementServices = (
  options?: UseProcurementServicesOptions,
) => {
  const include = options?.include ?? ALL_RESOURCES;

  const [
    { data: products },
    { data: services },
    { data: projects },
    { data: vendors },
  ] = useQueries({
    queries: [
      { ...productsQueryOptions(options?.products), enabled: include.includes('products') },
      { ...servicesQueryOptions(options?.services), enabled: include.includes('services') },
      { ...projectsQueryOptions(options?.projects), enabled: include.includes('projects') },
      { ...vendorsQueryOptions(options?.vendors), enabled: include.includes('vendors') },
    ],
  });

  return { products, services, projects, vendors };
};
