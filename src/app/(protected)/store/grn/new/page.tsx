import type { Metadata } from 'next';

import { connection } from 'next/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { GrnForm } from '@/features/store/components/grns/grn-form';
// import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import {
  getGrnNumber,
  getPendingReceiptOrders,
} from '@/features/store/services/grns/data';
import { getStores } from '@/features/store/services/stores/data';
import { transformOptions } from '@/lib/helpers/formatters';

export const metadata: Metadata = {
  title: 'Create new GRN',
};
export default function CreateGrnPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create new GRN"
        description="Create a new Goods Receipt Note"
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the GRN form"
        loader={<FormLoader />}
      >
        <CreateGrnContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function CreateGrnContent() {
  await connection();
  const [pendingOrders, grnNo, stores] = await Promise.all([
    getPendingReceiptOrders(),
    getGrnNumber(),
    getStores(),
  ]);

  return (
    <GrnForm
      defaultReceiptDate={new Date().toISOString()}
      pendingOrders={transformOptions(pendingOrders)}
      grnNo={grnNo}
      stores={transformOptions(
        stores.map(s => ({ id: s.id, name: s.storeName.toUpperCase() }))
      )}
    />
  );
}
