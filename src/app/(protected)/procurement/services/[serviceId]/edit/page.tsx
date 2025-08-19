import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { ServiceForm } from '@/features/procurement/components/services/service-form';
import { getService } from '@/features/procurement/services/services/data';
import { titleCase } from '@/lib/helpers/formatters';

type Params = Promise<{ serviceId: string }>;

export const metadata: Metadata = {
  title: 'Edit Service',
};

export default async function EditService({ params }: { params: Params }) {
  const service = await getService((await params).serviceId);
  if (!service) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <FormHeader
        title="Edit Service"
        description={`Update the details of the ${titleCase(
          service.serviceName
        )} service.`}
      />

      <ServiceForm service={service} />
    </div>
  );
}
