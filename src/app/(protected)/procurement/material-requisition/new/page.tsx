import type { Metadata } from 'next';
import FormHeader from '@/components/custom/form-header';
import { RequisitionForm } from '@/features/procurement/components/material-requisitions/requisition-form';
import {
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
  getRequisitionNo,
} from '@/features/procurement/services/material-requisitions/data';

export const metadata: Metadata = {
  title: 'New Material Requisition',
  description: 'Create a new material requisition',
};

export default async function NewMaterialRequisitionPage() {
  const [projects, products, services, requisitionNo] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    getRequisitionNo(),
  ]);

  return (
    <div className="space-y-6">
      <FormHeader
        title="Create Material Requisition"
        description="Create a new material requisition"
      />
      <RequisitionForm
        requisitionNo={requisitionNo}
        projects={projects}
        products={products}
        services={services}
        key={requisitionNo}
      />
    </div>
  );
}
