import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import FormHeader from '@/components/custom/form-header';
import { ServiceForm } from '@/features/procurement/components/services/service-form';
import { getService } from '@/features/procurement/services/services/data';
import { titleCase } from '@/lib/helpers/formatters';

type Params = Promise<{ serviceId: string }>;

export const metadata: Metadata = {
  title: 'Edit Service',
};

export default function EditService({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the service"
        loader={<FormLoader />}
      >
        <EditServiceContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditServiceContent({ params }: { params: Params }) {
  const service = await getService((await params).serviceId);
  if (!service) {
    notFound();
  }

  return (
    <>
      <FormHeader
        title="Edit Service"
        description={`Update the details of the ${titleCase(
          service.serviceName
        )} service.`}
      />
      <ServiceForm service={service} />
    </>
  );
}
