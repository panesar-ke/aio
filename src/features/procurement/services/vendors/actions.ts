"use server";

import type { z } from "zod";

import { and, count, eq, ne, sql } from "drizzle-orm";

import db from "@/drizzle/db";
import { itExpenses, ordersHeader, projects, vendors } from "@/drizzle/schema";
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
import { normalizeString } from "@/lib/string-normalizers";

import { getVendor } from "./data";

type VendorData = z.infer<typeof vendorSchema>;

const buildVendorPayload = (values: VendorData) => {
  return {
    vendorName: normalizeString(values.vendorName),
    contactPerson: normalizeString(values.contactPerson),
    contact: values.contact,
    email: values.email,
    kraPin: values.kraPin,
    address: values.address,
    active: values.id ? Boolean(values.active) : true,
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

export const deleteVendor = async (id: string) =>
  runAction("delete-vendor", async () => {
    await requireAnyPermission(["procurement:admin"]);
    if (!id) {
      return { error: true, message: "Vendor ID is required for deletion." };
    }

    const [existingOrders, existingExpenses] = await Promise.all([
      db.$count(ordersHeader, eq(ordersHeader.vendorId, id)),
      db.$count(itExpenses, eq(itExpenses.vendorId, id)),
    ]);

    if (existingOrders > 0 || existingExpenses > 0) {
      return {
        error: true,
        message: "Vendor cannot be deleted as they are referenced elsewhere.",
      };
    }

    await db.delete(vendors).where(eq(vendors.id, id));

    revalidateVendors(id);
    return {
      error: false,
      message: "Vendor deleted successfully.",
    };
  });

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
