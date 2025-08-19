import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { ServiceForm } from '@/features/procurement/components/services/service-form';

export const metadata: Metadata = {
  title: 'New Service',
};

export default function CreateNewService() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create New Service"
        description="Fill in the details to create a new service."
      />

      <ServiceForm />
    </div>
  );
}
