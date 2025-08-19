'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import {
  getService,
  serviceIsReferenced,
} from '@/features/procurement/services/services/data';
import { services } from '@/drizzle/schema';
import { revalidateServices } from '@/features/procurement/utils/cache';
import { validateFields } from '@/lib/action-validator';
import { serviceSchema } from '@/features/procurement/utils/schemas';

export const createService = async (values: unknown) => {
  try {
    const { error, data } = validateFields(values, serviceSchema);
    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const [{ id }] = await db
      .insert(services)
      .values(data)
      .returning({ id: services.id });

    revalidateServices(id);

    return {
      error: false,
      message: 'Service created successfully.',
      data: { id },
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return {
      error: true,
      message: 'Failed to create service. Please try again.',
    };
  }
};

export const updateService = async (id: string, values: unknown) => {
  try {
    if (!id) {
      return {
        error: true,
        message: 'Service ID is required.',
      };
    }

    const { error, data } = validateFields(values, serviceSchema);
    if (error !== null) {
      return {
        error: true,
        message: error,
      };
    }

    const service = await getService(id);
    if (!service) {
      return {
        error: true,
        message: 'Service not found.',
      };
    }

    await db.update(services).set(data).where(eq(services.id, id));
    revalidateServices(id);
  } catch (error) {
    console.error('Error updating service:', error);
    return {
      error: true,
      message: 'Failed to update service. Please try again.',
    };
  }
  redirect(`/procurement/services`);
};

export const deleteService = async (serviceId: string) => {
  try {
    if (!serviceId) {
      return {
        error: true,
        message: 'Service ID is required.',
      };
    }

    const service = await getService(serviceId);
    if (!service) {
      return {
        error: true,
        message: 'Service not found.',
      };
    }

    const isReferenced = await serviceIsReferenced(serviceId);

    if (isReferenced) {
      return {
        error: true,
        message: 'Service is referenced elsewhere and cannot be deleted.',
      };
    }

    await db.delete(services).where(eq(services.id, serviceId));
    revalidateServices(serviceId);
  } catch (error) {
    console.error('Error deleting service:', error);
    return {
      error: true,
      message: 'Failed to delete service. Please try again.',
    };
  }
  redirect('/procurement/services');
};

export const toggleServiceState = async (serviceId: string) => {
  try {
    if (!serviceId) {
      return {
        error: true,
        message: 'Service ID is required.',
      };
    }

    const service = await getService(serviceId);
    if (!service) {
      return {
        error: true,
        message: 'Service not found.',
      };
    }

    await db
      .update(services)
      .set({ active: !service.active })
      .where(eq(services.id, serviceId));

    revalidateServices(serviceId);

    return {
      error: false,
      message: `Service ${
        service.active ? 'deactivated' : 'activated'
      } successfully.`,
    };
  } catch (error) {
    console.error('Error toggling service state:', error);
    return {
      error: true,
      message: 'Failed to update service state. Please try again.',
    };
  }
};
