import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
// import { getActiveVendors } from '@/features/procurement/services/purchase-orders/data';
import {
  getGrnNumber,
  getPendingReceiptOrders,
} from '@/features/store/services/grns/data';
import { GrnForm } from '@/features/store/components/grns/grn-form';
import { transformOptions } from '@/lib/helpers/formatters';
import { getStores } from '@/features/store/services/stores/data';

export const metadata: Metadata = {
  title: 'Create new GRN',
};
export default async function CreateGrnPage() {
  const [pendingOrders, grnNo, stores] = await Promise.all([
    // getActiveVendors(),
    getPendingReceiptOrders(),
    getGrnNumber(),
    getStores(),
  ]);
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create new GRN"
        description="Create a new Goods Receipt Note"
      />
      <GrnForm
        // vendors={vendors}
        pendingOrders={transformOptions(pendingOrders)}
        grnNo={grnNo}
        stores={transformOptions(
          stores.map(s => ({ id: s.id, name: s.storeName.toUpperCase() }))
        )}
      />
    </div>
  );
}
