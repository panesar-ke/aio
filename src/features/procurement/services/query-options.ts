import { queryOptions } from '@tanstack/react-query';

import { type Option } from '@/types/index.types';

const fetchProducts = async (): Promise<Array<Option>> => {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

const fetchServices = async (): Promise<Array<Option>> => {
  const response = await fetch('/api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const fetchProjects = async (): Promise<Array<Option>> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};
const fetchVendors = async (): Promise<Array<Option>> => {
  const response = await fetch('/api/vendors');
  if (!response.ok) {
    throw new Error('Failed to fetch vendors');
  }
  return response.json();
};

export const productsQueryOptions = (initialData?: Array<Option>) =>
  queryOptions({
    queryKey: ['products'],
    queryFn: fetchProducts,
    initialData,
  });

export const servicesQueryOptions = (initialData?: Array<Option>) =>
  queryOptions({
    queryKey: ['services'],
    queryFn: fetchServices,
    initialData,
  });

export const projectsQueryOptions = (initialData?: Array<Option>) =>
  queryOptions({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialData,
  });

export const vendorsQueryOptions = (initialData?: Array<Option>) =>
  queryOptions({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    initialData,
  });
