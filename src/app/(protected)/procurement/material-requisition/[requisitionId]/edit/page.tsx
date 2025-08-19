import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
  getRequisition,
} from '@/features/procurement/services/material-requisitions/data';
import { RequisitionForm } from '@/features/procurement/components/material-requisitions/requisition-form';

export const metadata: Metadata = {
  title: 'Edit Material Requisition',
  description: 'Edit an existing material requisition',
};

type Params = Promise<{ requisitionId: string }>;

export default async function EditPage({ params }: { params: Params }) {
  const { requisitionId } = await params;
  const [projects, products, services, requisition] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    getRequisition(requisitionId),
  ]);

  return (
    <div className="space-y-6">
      <FormHeader title="Edit Requisition" />
      <RequisitionForm
        requisitionNo={requisition.id}
        key={requisition.reference}
        products={products}
        projects={projects}
        services={services}
        requisition={requisition}
      />
    </div>
  );
}
