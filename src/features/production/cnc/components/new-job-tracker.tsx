'use client';

import { PlusIcon } from 'lucide-react';

import CustomModal from '@/components/custom/custom-modal';
import { Button } from '@/components/ui/button';
import { useModal } from '@/features/integrations/modal-provider';
import { JobTrackerForm } from '@/features/production/cnc/components/job-tracker-form';

export function NewJobTrackerButton() {
  const { setOpen } = useModal();
  return (
    <Button
      variant="default"
      className="ml-auto"
      onClick={() =>
        setOpen(
          <CustomModal title="New Job" className="lg:max-w-3xl w-2xl">
            <JobTrackerForm />
          </CustomModal>
        )
      }
    >
      <PlusIcon />
      New Job
    </Button>
  );
}
