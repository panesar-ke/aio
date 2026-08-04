"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/drizzle/db";
import { services } from "@/drizzle/schema";
import {
  getService,
  serviceIsReferenced,
} from "@/features/procurement/services/services/data";
import { revalidateServices } from "@/features/procurement/utils/cache";
import { serviceSchema } from "@/features/procurement/utils/schemas";
import { parseOrFail, runAction } from "@/lib/actions/safe-action";
import { toDecimalNumber } from "@/lib/helpers/numbers";
import {
  requireAnyPermission,
  requirePermission,
} from "@/lib/permissions/guards";
import { normalizeString } from "@/lib/string-normalizers";

import type { ServiceFormValues } from "../../utils/procurement.types";

const buildServicePayload = (values: ServiceFormValues) => {
  return {
    id: values.id ?? crypto.randomUUID(),
    serviceName: normalizeString(values.serviceName),
    serviceFee: toDecimalNumber(values.serviceFee),
    active: values.id ? values.active : true,
  };
};

export const upsertService = async (values: unknown) =>
  runAction("upsert-service", async () => {
    await requireAnyPermission(["procurement:admin", "procurement:standard"]);
    const data = parseOrFail(serviceSchema, values);

    if (data.id) {
      const service = await getService(data.id);
      if (!service) {
        return {
          error: true,
          message: "Service not found.",
        };
      }
    }

    const [{ id }] = await db
      .insert(services)
      .values(buildServicePayload(data))
      .onConflictDoUpdate({
        target: services.id,
        set: buildServicePayload(data),
      })
      .returning({ id: services.id });

    revalidateServices(id);

    return {
      error: false,
      message: data.id
        ? "Service updated successfully."
        : "Service created successfully.",
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

    const service = await getService(serviceId);
    if (!service) {
      return {
        error: true,
        message: "Service not found.",
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
        service.active ? "deactivated" : "activated"
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
