import { useQueries } from '@tanstack/react-query';
import {
  productsQueryOptions,
  projectsQueryOptions,
  servicesQueryOptions,
  vendorsQueryOptions,
} from '@/features/procurement/services/query-options';

export const useProcurementServices = () => {
  const [
    { data: products },
    { data: services },
    { data: projects },
    { data: vendors },
  ] = useQueries({
    queries: [
      productsQueryOptions(),
      servicesQueryOptions(),
      projectsQueryOptions(),
      vendorsQueryOptions(),
    ],
  });

  return { products, services, projects, vendors };
};
