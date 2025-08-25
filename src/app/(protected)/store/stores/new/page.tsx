import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { StoreForm } from '@/features/store/components/stores/store-form';

export const metadata: Metadata = {
  title: 'Create Store',
};
export default function CreateStorePage() {
  return (
    <div className="space-y-6">
      <FormHeader title="Create Store" description="Create a new store" />
      <StoreForm />
    </div>
  );
}
