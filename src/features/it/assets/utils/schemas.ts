import { z } from 'zod';

export const assetStatusValues = [
  'in_stock',
  'assigned',
  'in_repair',
  'retired',
  'disposed',
  'lost',
] as const;

export const assetConditionValues = [
  'new',
  'good',
  'fair',
  'damaged',
  'refurbished',
] as const;

export const assetCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().nullish(),
});

export const assetFormSchemaValues = z
  .object({
    id: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    name: z.string().min(2, 'Asset name is required'),
    brand: z.string().nullish(),
    model: z.string().nullish(),
    serialNumber: z.string().nullish(),
    specs: z.string().nullish(),
    purchaseDate: z.string().date().nullish(),
    purchaseCost: z
      .number()
      .nonnegative('Purchase cost must be 0 or greater')
      .nullish(),
    vendorId: z.string().nullish(),
    warrantyExpiryDate: z.string().date().nullish(),
    status: z.enum(assetStatusValues),
    condition: z.enum(assetConditionValues),
    departmentId: z.string().nullish(),
    notes: z.string().nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseDate && data.warrantyExpiryDate) {
      const purchaseDate = new Date(data.purchaseDate);
      const warrantyExpiryDate = new Date(data.warrantyExpiryDate);

      purchaseDate.setHours(0, 0, 0, 0);
      warrantyExpiryDate.setHours(0, 0, 0, 0);

      if (warrantyExpiryDate < purchaseDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Warranty expiry date cannot be before purchase date.',
          path: ['warrantyExpiryDate'],
        });
      }
    }
  });

export const assignmentFormSchemaValues = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  userId: z.string().min(1, 'User is required'),
  assignedDate: z.string().date(),
  assignmentNotes: z.string().nullish(),
});

export const assetStatusChangeSchema = z.object({
  id: z.string().min(1, 'Asset id is required'),
  status: z.enum(['in_repair', 'retired', 'disposed', 'lost']),
});

export const assetsSearchParamsSchema = z
  .object({
    search: z.string().nullish(),
    from: z.string().date().nullish(),
    to: z.string().date().nullish(),
    status: z.enum(assetStatusValues).nullish(),
    condition: z.enum(assetConditionValues).nullish(),
    categoryId: z.string().nullish(),
    departmentId: z.coerce.number().int().positive().nullish(),
  })
  .refine(
    data => {
      if (!data.from || !data.to) return true;
      const from = new Date(data.from);
      const to = new Date(data.to);

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return from <= to;
    },
    {
      message: 'From date must be before or equal to To date.',
      path: ['from', 'to'],
    },
  );

export const assetAssignmentsSearchParamsSchema = z
  .object({
    search: z.string().nullish(),
    from: z.string().date().nullish(),
    to: z.string().date().nullish(),
    assetId: z.string().nullish(),
    userId: z.string().nullish(),
  })
  .refine(
    data => {
      if (!data.from || !data.to) return true;
      const from = new Date(data.from);
      const to = new Date(data.to);

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return from <= to;
    },
    {
      message: 'From date must be before or equal to To date.',
      path: ['from', 'to'],
    },
  );

export type AssetCategorySchema = z.infer<typeof assetCategorySchema>;
export type AssetFormSchemaValues = z.infer<typeof assetFormSchemaValues>;
export type AssignmentFormSchemaValues = z.infer<
  typeof assignmentFormSchemaValues
>;
export type AssetsSearchParamsSchema = z.infer<typeof assetsSearchParamsSchema>;
export type AssetAssignmentsSearchParamsSchema = z.infer<
  typeof assetAssignmentsSearchParamsSchema
>;
