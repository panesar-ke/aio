import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ErrorBoundaryWithSuspense } from "@/components/custom/error-boundary-with-suspense";
import { FormLoader } from "@/components/custom/loaders";
import { RequisitionForm } from "@/features/procurement/components/material-requisitions/requisition-form";
import {
  getRequisition,
  getSelectableProducts,
  getSelectableProjects,
  getSelectableServices,
} from "@/features/procurement/services/material-requisitions/data";

export const metadata: Metadata = {
  title: "Edit Material Requisition",
  description: "Edit an existing material requisition",
};

type Params = Promise<{ requisitionId: string }>;

export default function EditPage({ params }: { params: Params }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <ErrorBoundaryWithSuspense
        errorMessage="Failed to load the requisition"
        loader={<FormLoader />}
      >
        <EditRequisitionContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function EditRequisitionContent({ params }: { params: Params }) {
  const { requisitionId } = await params;
  const [projects, products, services, requisition] = await Promise.all([
    getSelectableProjects(),
    getSelectableProducts(),
    getSelectableServices(),
    getRequisition(requisitionId),
  ]);

  if (!requisition) notFound();

  return (
    <>
      <RequisitionForm
        requisitionNo={requisition.id}
        key={requisition.reference}
        products={products}
        projects={projects}
        services={services}
        requisition={requisition}
      />
    </>
  );
}
