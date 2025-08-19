import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import FormHeader from '@/components/custom/form-header';
import { getRequisition } from '@/features/procurement/services/material-requisitions/data';
import { RequisitionView } from '@/features/procurement/components/material-requisitions/requisition-view';

type Params = Promise<{ requisitionId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { requisitionId } = await params;
  const requisition = await getRequisition(requisitionId);
  return {
    title: `Material Requisition ${requisition.id || 'Details'}`,
    description: `Details for requisition ${requisition.id || ''}`,
  };
}

export default async function DetailsPage({ params }: { params: Params }) {
  const { requisitionId } = await params;

  return (
    <ErrorBoundary fallback={<div>Error loading requisition details</div>}>
      <Suspense fallback={<p>Loading requisition details...</p>}>
        <SuspendedRequisitionView requisitionId={requisitionId} />
      </Suspense>
    </ErrorBoundary>
  );
}

async function SuspendedRequisitionView({
  requisitionId,
}: {
  requisitionId: string;
}) {
  const requisition = await getRequisition(requisitionId);

  return (
    <div className="space-y-6">
      <FormHeader
        title={`Material Requisition Details`}
        description={`View details of the material requisition ${requisition.id}`}
      />
      <RequisitionView requisition={requisition} />
    </div>
  );
}
