'use server';

import { redirect } from 'next/navigation';
import { count, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import db from '@/drizzle/db';
import { ordersHeader, projects, vendors } from '@/drizzle/schema';
import {
  projectFormSchema,
  vendorSchema,
} from '@/features/procurement/utils/schemas';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';
import {
  revalidateProjects,
  revalidateVendors,
} from '@/features/procurement/utils/cache';
import { validateFields } from '@/lib/action-validator';

type VendorData = z.infer<typeof vendorSchema>;

const validateVendorData = (
  vendorData: unknown
): SchemaValidationSuccess<VendorData> | SchemaValidationFailure => {
  const { success, data, error } = vendorSchema.safeParse(vendorData);

  if (!success) {
    console.error('Validation errors:', error?.flatten().fieldErrors);
    return {
      data: null,
      error: 'Invalid vendor data provided.',
    } satisfies SchemaValidationFailure;
  }

  return {
    data,
    error: null,
  } satisfies SchemaValidationSuccess<VendorData>;
};

export const createVendor = async (vendorData: unknown) => {
  const validation = validateVendorData(vendorData);

  if (validation.error !== null) {
    return {
      error: true,
      message: validation.error,
    };
  }

  const { data } = validation;

  try {
    const [{ id }] = await db
      .insert(vendors)
      .values({ ...data })
      .returning({ id: vendors.id });

    revalidateVendors(id);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return {
      error: true,
      message: 'Failed to create vendor. Please try again.',
    };
  }
  // redirect('/procurement/vendors');
};

export const updateVendor = async (id: string, vendorData: unknown) => {
  if (!id) {
    return {
      error: true,
      message: 'Vendor ID is required for updates.',
    };
  }

  const validation = validateVendorData(vendorData);

  if (validation.error !== null) {
    return {
      error: true,
      message: validation.error,
    };
  }

  try {
    const existingVendor = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (existingVendor.length === 0) {
      return {
        error: true,
        message: 'Vendor not found.',
      };
    }

    await db.update(vendors).set(validation.data).where(eq(vendors.id, id));

    revalidateVendors(id);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return {
      error: true,
      message: 'Failed to update vendor. Please try again.',
    };
  }
  redirect('/procurement/vendors');
};

export const deleteVendor = async (id: string) => {
  if (!id) {
    return {
      error: true,
      message: 'Vendor ID is required for deletion.',
    };
  }

  try {
    const existingOrders = await db.$count(
      ordersHeader,
      eq(ordersHeader.vendorId, id)
    );

    if (existingOrders > 0) {
      return {
        error: true,
        message: 'Vendor has existing orders and cannot be deleted.',
      };
    }

    await db.delete(vendors).where(eq(vendors.id, id));

    revalidateVendors(id);
    return {
      error: false,
      message: 'Vendor deleted successfully.',
    };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return {
      error: true,
      message: 'Failed to delete vendor. Please try again.',
    };
  }
};

export const createProject = async (projectData: unknown) => {
  const validation = validateFields(projectData, projectFormSchema);

  if (validation.error !== null) {
    return {
      error: true,
      message: validation.error,
    };
  }

  const { data } = validation;

  const found = await db
    .select({
      count: count(projects.id),
    })
    .from(projects)
    .where(eq(sql`LOWER(project_name)`, data.projectName.toLowerCase()))
    .limit(1);

  if (found[0]?.count > 0) {
    return {
      error: true,
      message: 'Project with this name already exists.',
    };
  }

  try {
    const [{ id }] = await db
      .insert(projects)
      .values({ ...data })
      .returning({ id: projects.id });

    revalidateProjects(id);
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      error: true,
      message: 'Failed to create project. Please try again.',
    };
  }
};
