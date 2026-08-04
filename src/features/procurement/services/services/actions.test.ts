import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, insert, updateReturning } = vi.hoisted(() => {
  const updateReturning = vi.fn(async () => [] as Array<Record<string, unknown>>);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  const insertReturning = vi.fn(async () => [{ id: "new-id" }]);
  const values = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values }));

  return { update, insert, updateWhere, updateReturning };
});

vi.mock("@/drizzle/db", () => ({
  default: {
    update,
    insert,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/procurement/utils/cache", () => ({
  revalidateServices: vi.fn(),
}));

vi.mock("@/features/procurement/services/services/data", () => ({
  getService: vi.fn(),
  serviceIsReferenced: vi.fn(),
}));

vi.mock("@/lib/permissions/guards", () => ({
  requireAnyPermission: vi.fn(),
  requirePermission: vi.fn(),
}));

import {
  toggleServiceState,
  upsertService,
} from "@/features/procurement/services/services/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertService", () => {
  it("reports not found instead of recreating the row when an update matches no service", async () => {
    updateReturning.mockResolvedValueOnce([]);

    const result = await upsertService({
      id: "missing-id",
      serviceName: "Cleaning",
      serviceFee: 100,
      active: true,
    });

    expect(result).toEqual({ error: true, message: "Service not found." });
    expect(insert).not.toHaveBeenCalled();
  });

  it("updates in place without inserting when the service exists", async () => {
    updateReturning.mockResolvedValueOnce([{ id: "existing-id" }]);

    const result = await upsertService({
      id: "existing-id",
      serviceName: "Cleaning",
      serviceFee: 100,
      active: true,
    });

    expect(result).toEqual({
      error: false,
      message: "Service updated successfully.",
    });
    expect(update).toHaveBeenCalledOnce();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts a new row when no id is supplied", async () => {
    const result = await upsertService({
      id: null,
      serviceName: "New service",
      serviceFee: 50,
      active: true,
    });

    expect(result).toEqual({
      error: false,
      message: "Service created successfully.",
    });
    expect(insert).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("toggleServiceState", () => {
  it("reports not found instead of a fabricated success when the service no longer exists", async () => {
    updateReturning.mockResolvedValueOnce([]);

    const result = await toggleServiceState("missing-id");

    expect(result).toEqual({ error: true, message: "Service not found." });
  });

  it("derives the success message from the row returned by the atomic toggle", async () => {
    updateReturning.mockResolvedValueOnce([{ active: true }]);

    const result = await toggleServiceState("existing-id");

    expect(result).toEqual({
      error: false,
      message: "Service activated successfully.",
    });
  });
});
