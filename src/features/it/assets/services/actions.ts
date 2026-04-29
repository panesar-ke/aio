'use server';

import { and, eq, isNull, ne, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import {
  itAssetAssignments,
  itAssetCategories,
  itAssets,
} from '@/drizzle/schema';
import {
  assetCategorySchema,
  assetFormSchemaValues,
  assetStatusChangeSchema,
  assignmentFormSchemaValues,
} from '@/features/it/assets/utils/schemas';
import { parseOrFail, runAction } from '@/lib/actions/safe-action';
import { dateFormat } from '@/lib/helpers/formatters';
import {
  requireAnyPermission,
  requirePermission,
} from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';
import {
  normalizeNullableString,
  normalizeString,
} from '@/lib/string-normalizers';

import { persistAssetUpsert } from './upsert-asset-persist';

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === '23505';

function parseSpecs(value: string | null | undefined) {
  const normalizedValue = normalizeNullableString(value);
  if (!normalizedValue) {
    return null;
  }

  try {
    return JSON.parse(normalizedValue) as Record<string, unknown>;
  } catch {
    return '__INVALID_JSON__' as const;
  }
}

export const createAssetCategory = async (values: unknown) =>
  runAction('create asset category', async () => {
    await requirePermission('it:admin');
    const data = parseOrFail(assetCategorySchema, values);
    const normalizedName = normalizeString(data.name);

    const exists = await db.query.itAssetCategories.findFirst({
      where: eq(
        sql`lower(${itAssetCategories.name})`,
        normalizedName.toLowerCase(),
      ),
      columns: { id: true },
    });

    if (exists) {
      return {
        error: true,
        message: 'Asset category already exists.',
      };
    }

    try {
      const [{ id }] = await db
        .insert(itAssetCategories)
        .values({
          name: normalizedName,
          description: normalizeNullableString(data.description),
        })
        .returning({ id: itAssetCategories.id });

      return {
        error: false,
        message: 'Asset category created successfully.',
        data: { id },
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { error: true, message: 'Asset category already exists.' };
      }

      throw error;
    }
  });

export const upsertAsset = async (values: unknown) =>
  runAction('upsert asset', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);
    const user = await getCurrentUser();
    const data = parseOrFail(assetFormSchemaValues, values);
    const normalizedSerialNumber = normalizeNullableString(data.serialNumber);

    if (normalizedSerialNumber) {
      const existingAsset = await db.query.itAssets.findFirst({
        where: and(
          eq(
            sql`lower(${itAssets.serialNumber})`,
            normalizedSerialNumber.toLowerCase(),
          ),
          data.id ? ne(itAssets.id, data.id) : undefined,
        ),
        columns: { id: true },
      });

      if (existingAsset) {
        return {
          error: true,
          message: 'Serial number already exists.',
        };
      }
    }

    const parsedSpecs = parseSpecs(data.specs);
    if (parsedSpecs === '__INVALID_JSON__') {
      return {
        error: true,
        message: 'Specs must be valid JSON.',
      };
    }

    try {
      const payload = {
        categoryId: data.categoryId,
        name: normalizeString(data.name),
        brand: normalizeNullableString(data.brand),
        model: normalizeNullableString(data.model),
        serialNumber: normalizedSerialNumber,
        specs: parsedSpecs,
        purchaseDate: data.purchaseDate ?? null,
        purchaseCost:
          typeof data.purchaseCost === 'number'
            ? data.purchaseCost.toString()
            : null,
        vendorId: data.vendorId ?? null,
        warrantyExpiryDate: data.warrantyExpiryDate ?? null,
        status: data.status,
        condition: data.condition,
        departmentId: data.departmentId ? Number(data.departmentId) : null,
        notes: normalizeNullableString(data.notes),
      } as const;

      const result = await persistAssetUpsert({
        id: data.id,
        payload,
        createdBy: user.id,
        insert: async ({ payload, createdBy }) => {
          const [{ id }] = await db
            .insert(itAssets)
            .values({
              ...payload,
              createdBy,
            })
            .returning({ id: itAssets.id });

          return { id };
        },
        update: async ({ id, payload }) => {
          const rows = await db
            .update(itAssets)
            .set(payload)
            .where(eq(itAssets.id, id))
            .returning({ id: itAssets.id });

          return rows[0] ?? null;
        },
      });

      if (result.error) {
        return result;
      }

      return {
        error: false,
        message: `Asset ${result.operation} successfully.`,
        data: { id: result.id },
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { error: true, message: 'Asset already exists.' };
      }

      throw error;
    }
  });

export const assignAsset = async (values: unknown) =>
  runAction('assign asset', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);
    const data = parseOrFail(assignmentFormSchemaValues, values);

    const asset = await db.query.itAssets.findFirst({
      where: eq(itAssets.id, data.assetId),
      columns: {
        id: true,
        status: true,
      },
    });

    if (!asset) {
      return { error: true, message: 'Asset not found.' };
    }

    if (asset.status === 'retired' || asset.status === 'disposed') {
      return {
        error: true,
        message: 'Retired or disposed assets cannot be assigned.',
      };
    }

    const custodyType = data.assetAssignmentCustodyType;
    const assignedUserId = custodyType === 'user' ? data.userId ?? null : null;
    const assignedDepartmentId =
      custodyType === 'department' && data.departmentId
        ? Number(data.departmentId)
        : null;

    await db.transaction(async tx => {
      const activeAssignment = await tx.query.itAssetAssignments.findFirst({
        where: and(
          eq(itAssetAssignments.assetId, data.assetId),
          isNull(itAssetAssignments.returnedDate),
        ),
        columns: { id: true },
      });

      if (activeAssignment) {
        await tx
          .update(itAssetAssignments)
          .set({
            returnedDate: data.assignedDate,
          })
          .where(eq(itAssetAssignments.id, activeAssignment.id));
      }

      await tx.insert(itAssetAssignments).values({
        assetId: data.assetId,
        assetAssignmentCustodyType: custodyType,
        userId: assignedUserId,
        departmentId: assignedDepartmentId,
        assignedDate: data.assignedDate,
        assignmentNotes: normalizeNullableString(data.assignmentNotes),
      });

      const assetUpdate = {
        currentAssignedUserId: assignedUserId,
        status: 'assigned' as const,
        ...(assignedDepartmentId != null
          ? { departmentId: assignedDepartmentId }
          : {}),
      };

      await tx
        .update(itAssets)
        .set(assetUpdate)
        .where(eq(itAssets.id, data.assetId));
    });

    return {
      error: false,
      message: 'Asset assignment updated successfully.',
    };
  });

export const returnAsset = async (assetId: string) =>
  runAction('return asset', async () => {
    await requireAnyPermission(['it:admin', 'it:standard']);

    const activeAssignment = await db.query.itAssetAssignments.findFirst({
      where: and(
        eq(itAssetAssignments.assetId, assetId),
        isNull(itAssetAssignments.returnedDate),
      ),
      columns: { id: true },
    });

    if (!activeAssignment) {
      return {
        error: true,
        message: 'Asset has no active assignment.',
      };
    }

    const today = dateFormat(new Date());

    await db.transaction(async tx => {
      await tx
        .update(itAssetAssignments)
        .set({ returnedDate: today })
        .where(eq(itAssetAssignments.id, activeAssignment.id));

      await tx
        .update(itAssets)
        .set({
          currentAssignedUserId: null,
          status: 'in_stock',
        })
        .where(eq(itAssets.id, assetId));
    });

    return {
      error: false,
      message: 'Asset returned successfully.',
    };
  });

export const changeAssetStatus = async (values: unknown) =>
  runAction('change asset status', async () => {
    await requirePermission('it:admin');
    const data = parseOrFail(assetStatusChangeSchema, values);

    const asset = await db.query.itAssets.findFirst({
      where: eq(itAssets.id, data.id),
      columns: { id: true, status: true },
    });

    if (!asset) {
      return {
        error: true,
        message: 'Asset not found.',
      };
    }

    if (asset.status === 'assigned') {
      return {
        error: true,
        message:
          'Return this asset before changing it to repair, retired, disposed, or lost.',
      };
    }

    await db
      .update(itAssets)
      .set({
        status: data.status,
      })
      .where(eq(itAssets.id, data.id));

    return {
      error: false,
      message: 'Asset status updated successfully.',
    };
  });

export const deleteAsset = async (id: string) =>
  runAction('delete asset', async () => {
    await requirePermission('it:admin');

    const asset = await db.query.itAssets.findFirst({
      where: eq(itAssets.id, id),
      columns: { id: true },
    });

    if (!asset) {
      return { error: true, message: 'Asset not found.' };
    }

    const hasAssignments = await db.query.itAssetAssignments.findFirst({
      where: eq(itAssetAssignments.assetId, id),
      columns: { id: true },
    });

    if (hasAssignments) {
      return {
        error: true,
        message: 'Cannot delete an asset with assignment history.',
      };
    }

    await db.delete(itAssets).where(eq(itAssets.id, id));

    return {
      error: false,
      message: 'Asset deleted successfully.',
    };
  });
