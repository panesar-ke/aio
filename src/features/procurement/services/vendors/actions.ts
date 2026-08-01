"use server";

import type { z } from "zod";

import { and, count, eq, ne, sql } from "drizzle-orm";

import db from "@/drizzle/db";
import { ordersHeader, projects, vendors } from "@/drizzle/schema";
import {
  revalidateProjects,
  revalidateVendors,
} from "@/features/procurement/utils/cache";
import {
  projectFormSchema,
  vendorSchema,
} from "@/features/procurement/utils/schemas";
import { validateFields } from "@/lib/action-validator";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import { requireAnyPermission } from "@/lib/permissions/guards";

import { getVendor } from "./data";

type VendorData = z.infer<typeof vendorSchema>;

const buildVendorPayload = (values: VendorData) => {
  return {
    vendorName: values.vendorName,
    contactPerson: values.contactPerson,
    contact: values.contact,
    email: values.email,
    kraPin: values.kraPin,
    address: values.address,
    active: values.active,
  };
};

export const upsertVendor = async (values: unknown) =>
  runAction("upsert-vendor", async () => {
    await requireAnyPermission(["procurement:admin", "procurement:standard"]);
    const data = parseOrFail(vendorSchema, values);

    const found = await db
      .select({
        count: count(vendors.id),
      })
      .from(vendors)
      .where(
        and(
          eq(sql`LOWER(vendor_name)`, data.vendorName.toLowerCase()),
          data.id ? ne(vendors.id, data.id) : undefined,
        ),
      )
      .limit(1);

    if (found[0]?.count > 0) {
      return {
        error: true,
        message: "Vendor with this name already exists.",
      };
    }

    if (data.id) {
      const vendor = await getVendor(data.id);
      if (!vendor) {
        return {
          error: true,
          message: "Vendor not found.",
        };
      }
      await db
        .update(vendors)
        .set(buildVendorPayload(data))
        .where(eq(vendors.id, data.id));
      revalidateVendors(data.id);
      return {
        error: false,
        message: "Vendor updated successfully.",
      };
    }

    const [{ id }] = await db
      .insert(vendors)
      .values({ ...buildVendorPayload(data) })
      .returning({ id: vendors.id });

    revalidateVendors(id);
    return {
      error: false,
      message: "Vendor created successfully.",
    };
  });

export const deleteVendor = async (id: string) => {
  if (!id) {
    return {
      error: true,
      message: "Vendor ID is required for deletion.",
    };
  }

  try {
    const existingOrders = await db.$count(
      ordersHeader,
      eq(ordersHeader.vendorId, id),
    );

    if (existingOrders > 0) {
      return {
        error: true,
        message: "Vendor has existing orders and cannot be deleted.",
      };
    }

    await db.delete(vendors).where(eq(vendors.id, id));

    revalidateVendors(id);
    return {
      error: false,
      message: "Vendor deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return {
      error: true,
      message: "Failed to delete vendor. Please try again.",
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
      message: "Project with this name already exists.",
    };
  }

  try {
    const [{ id }] = await db
      .insert(projects)
      .values({ ...data })
      .returning({ id: projects.id });

    revalidateProjects(id);
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      error: true,
      message: "Failed to create project. Please try again.",
    };
  }
};
