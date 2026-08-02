import { describe, expect, it } from 'vitest';

import {
  conversionSchema,
  grnFormSchema,
  materialIssueFormSchema,
} from '@/features/store/utils/schema';

const validGrnItem = {
  id: 'item-1',
  itemId: 'item-1',
  productName: 'Widget',
  orderedQty: 5,
  qty: 5,
};

const validGrn = {
  receiptDate: new Date('2026-01-01'),
  orderId: 'order-1',
  vendorId: 'vendor-1',
  vendorName: 'Vendor',
  storeId: 'store-1',
  items: [validGrnItem],
};

describe('grnFormSchema quantity fields', () => {
  it('reports "Field is required" when orderedQty is missing', () => {
    const itemWithoutOrderedQty: Record<string, unknown> = { ...validGrnItem };
    delete itemWithoutOrderedQty.orderedQty;
    const result = grnFormSchema.safeParse({
      ...validGrn,
      items: [itemWithoutOrderedQty],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('orderedQty'),
      );
      expect(issue?.message).toBe('Field is required');
    }
  });

  it('reports "Field must be a number" when qty is present but not numeric', () => {
    const result = grnFormSchema.safeParse({
      ...validGrn,
      items: [{ ...validGrnItem, qty: 'not-a-number' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('qty'));
      expect(issue?.message).toBe('Field must be a number');
    }
  });

  it('accepts valid quantities', () => {
    expect(grnFormSchema.safeParse(validGrn).success).toBe(true);
  });
});

describe('materialIssueFormSchema issuedQty', () => {
  const validIssue = {
    issueNo: 1,
    issueDate: new Date('2026-01-01'),
    staffIssued: 'staff-1',
    fromStoreId: 'store-1',
    items: [
      {
        id: 'item-1',
        itemId: 'item-1',
        stockBalance: 10,
        issuedQty: 5,
      },
    ],
  };

  it('reports "Field is required" when issuedQty is missing', () => {
    const itemWithoutIssuedQty: Record<string, unknown> = {
      ...validIssue.items[0],
    };
    delete itemWithoutIssuedQty.issuedQty;
    const result = materialIssueFormSchema.safeParse({
      ...validIssue,
      items: [itemWithoutIssuedQty],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('issuedQty'),
      );
      expect(issue?.message).toBe('Field is required');
    }
  });

  it('accepts a valid issuedQty', () => {
    expect(materialIssueFormSchema.safeParse(validIssue).success).toBe(true);
  });
});

describe('conversionSchema conversionDate', () => {
  const validConversion = {
    conversionDate: new Date('2026-01-01'),
    finalProduct: 'product-1',
    convertedQty: 5,
    convertingItems: [
      {
        id: 'item-1',
        itemId: 'item-1',
        convertingQty: 5,
      },
    ],
  };

  it('reports "Conversion date is required." when the field is missing', () => {
    const withoutDate: Record<string, unknown> = { ...validConversion };
    delete withoutDate.conversionDate;
    const result = conversionSchema.safeParse(withoutDate);

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('conversionDate'),
      );
      expect(issue?.message).toBe('Conversion date is required.');
    }
  });

  it('reports a valid-date message when the field is present but invalid', () => {
    const result = conversionSchema.safeParse({
      ...validConversion,
      conversionDate: 'not-a-date',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('conversionDate'),
      );
      expect(issue?.message).toBe('Conversion date must be a valid date.');
    }
  });

  it('accepts a valid conversion date', () => {
    expect(conversionSchema.safeParse(validConversion).success).toBe(true);
  });
});
