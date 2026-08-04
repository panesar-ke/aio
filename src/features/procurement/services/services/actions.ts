"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ServiceFormValues } from "@/features/procurement/utils/procurement.types";

import db from "@/drizzle/db";
import { services } from "@/drizzle/schema";
import {
  getService,
  serviceIsReferenced,
} from "@/features/procurement/services/services/data";
import { revalidateServices } from "@/features/procurement/utils/cache";
import { serviceSchema } from "@/features/procurement/utils/schemas";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import { toNumber } from "@/lib/helpers/numbers";
import {
  requireAnyPermission,
  requirePermission,
} from "@/lib/permissions/guards";
import { normalizeString } from "@/lib/string-normalizers";

const buildServicePayload = (values: ServiceFormValues) => {
  return {
    id: values.id ?? crypto.randomUUID(),
    serviceName: normalizeString(values.serviceName),
    serviceFee: toNumber(values.serviceFee),
    active: values.id ? values.active : true,
  };
};

export const upsertService = async (values: unknown) =>
  runAction("upsert-service", async () => {
    await requireAnyPermission(["procurement:admin", "procurement:standard"]);
    const data = parseOrFail(serviceSchema, values);

    if (data.id) {
      const [updated] = await db
        .update(services)
        .set(buildServicePayload(data))
        .where(eq(services.id, data.id))
        .returning({ id: services.id });

      if (!updated) {
        return {
          error: true,
          message: "Service not found.",
        };
      }

      revalidateServices(updated.id);

      return {
        error: false,
        message: "Service updated successfully.",
      };
    }

    const [{ id }] = await db
      .insert(services)
      .values(buildServicePayload(data))
      .returning({ id: services.id });

    revalidateServices(id);

    return {
      error: false,
      message: "Service created successfully.",
    };
  });

export const deleteService = async (serviceId: string) =>
  runAction("delete-service", async () => {
    await requirePermission("procurement:admin");

    const service = await getService(serviceId);
    if (!service) {
      return {
        error: true,
        message: "Service not found.",
      };
    }

    const isReferenced = await serviceIsReferenced(serviceId);

    if (isReferenced) {
      return {
        error: true,
        message: "Service is referenced elsewhere and cannot be deleted.",
      };
    }

    await db.delete(services).where(eq(services.id, serviceId));
    revalidateServices(serviceId);
    revalidatePath("/procurement/services");

    return {
      error: false,
      message: "Service deleted successfully.",
    };
  });

export const toggleServiceState = async (serviceId: string) => {
  try {
    if (!serviceId) {
      return {
        error: true,
        message: "Service ID is required.",
      };
    }

    const [updated] = await db
      .update(services)
      .set({ active: sql`not ${services.active}` })
      .where(eq(services.id, serviceId))
      .returning({ active: services.active });

    if (!updated) {
      return {
        error: true,
        message: "Service not found.",
      };
    }

    revalidateServices(serviceId);

    return {
      error: false,
      message: `Service ${
        updated.active ? "activated" : "deactivated"
      } successfully.`,
    };
  } catch (error) {
    console.error("Error toggling service state:", error);
    return {
      error: true,
      message: "Failed to update service state. Please try again.",
    };
  }
};
