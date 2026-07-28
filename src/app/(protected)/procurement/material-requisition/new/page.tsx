import type { Metadata } from 'next';
import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
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

export default function NewMaterialRequisitionPage() {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Create Material Requisition"
        description="Create a new material requisition"
      />
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the requisition form"
        loader={<FormLoader />}
      >
        <NewMaterialRequisitionContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewMaterialRequisitionContent() {
  const [projects, products, services, requisitionNo] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    getRequisitionNo(),
  ]);

  return (
    <RequisitionForm
      requisitionNo={requisitionNo}
      projects={projects}
      products={products}
      services={services}
      key={requisitionNo}
    />
  );
}
