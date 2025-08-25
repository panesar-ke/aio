import { type Option } from '@/types/index.types';
import { queryOptions } from '@tanstack/react-query';

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

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

export const servicesQueryOptions = () =>
  queryOptions({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

export const projectsQueryOptions = () =>
  queryOptions({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

export const vendorsQueryOptions = () =>
  queryOptions({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });
