import { eventType, staticSchema } from 'inngest';

import { PRODUCTS_IMPORT_EVENT } from '@/features/procurement/services/products-import/constants';

type SendNewPasswordEventData = {
  contact: string;
  password: string;
  name: string;
};

type ProductsImportRequestedEventData = {
  batchId: string;
};

type StoreProductDeactivationEventData = {
  requestId: string;
  source: 'vercel-cron';
  triggeredAt: string;
};

export const sendNewPasswordEvent = eventType('user/send.new.password', {
  schema: staticSchema<SendNewPasswordEventData>(),
});

export const productsImportRequestedEvent = eventType(PRODUCTS_IMPORT_EVENT, {
  schema: staticSchema<ProductsImportRequestedEventData>(),
});

export const storeProductDeactivationEvent = eventType(
  'store/run.product-deactivation',
  {
    schema: staticSchema<StoreProductDeactivationEventData>(),
  },
);
