import { formOptions } from '@tanstack/react-form';

import {
  saleOrderFormSchema,
  type SaleOrderFormValues,
} from '@/features/sales/utils/schemas';
import { dateFormat } from '@/lib/helpers/formatters';

export const saleOrderFormOpts = (
  order?: SaleOrderFormValues,
  account?: string | null,
) => {
  return formOptions({
    defaultValues:
      order ??
      ({
        id: null,
        orderDate: dateFormat(new Date()),
        accountId: account ?? '',
        vatType: 'INCLUSIVE',
        details: [],
        currency: 'KES',
        exchangeRate: 1,
      } as SaleOrderFormValues),
    validators: {
      onSubmit: saleOrderFormSchema,
    },
  });
};
