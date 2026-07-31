import type { Metadata } from "next";
import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";
import { FormLoader } from "@/components/custom/loaders";
import { RequisitionForm } from "@/features/procurement/components/material-requisitions/requisition-form";
import {
  getSelectableProducts,
  getSelectableProjects,
  getRequisitionNo,
  getSelectableServices,
} from "@/features/procurement/services/material-requisitions/data";

export const metadata: Metadata = {
  title: "New Material Requisition",
  description: "Create a new material requisition",
};

export default function NewMaterialRequisitionPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
