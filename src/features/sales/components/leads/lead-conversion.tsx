import { CheckCircleIcon } from 'lucide-react';
import { useActionState, useEffect } from 'react';

import type { Lead } from '@/features/sales/utils/sales.types';

import { CustomAlert } from '@/components/custom/custom-alert';
import { FormActions } from '@/components/custom/form-actions';
import { useModal } from '@/features/integrations/modal-provider';
import { convertToCustomer } from '@/features/sales/services/leads/action';

const initialState: {
  error: boolean;
  message: string | null;
} = {
  error: false,
  message: null,
};

export function LoadConversionForm({ lead }: { lead: Lead }) {
  const [state, formAction, isPending] = useActionState(
    convertToCustomer,
    initialState,
  );
  const { setClose } = useModal();

  useEffect(() => {
    if (state.error === false && state.message !== null) {
      setClose();
    }
  }, [state.error, state.message, setClose]);

  return (
    <form className='space-y-6' action={formAction}>
      {state.error && (
        <CustomAlert
          title='Error'
          description={
            state.message ??
            'Error converting lead to customer. Please try again.'
          }
          variant='error'
        />
      )}
      <div className='space-y-2'>
        <h3 className='text-sm font-medium'>Lead Details</h3>
        <div className='bg-tertiary rounded-lg grid md:grid-cols-2 gap-6 p-4'>
          <LeadItem title='Lead Name' value={lead.name} />
          <LeadItem title='Lead Company' value={lead.company} />
          <LeadItem title='Lead Phone' value={lead.phone} />
          <LeadItem title='Lead Title' value={lead.title} />
          <LeadItem title='Lead Email' value={lead.email} />
          <LeadItem title='Lead Kra Pin' value={lead.kraPin} />
        </div>
      </div>
      <div className='bg-success/50 p-4 border-success rounded-lg border'>
        <div className='flex items-center gap-2'>
          <CheckCircleIcon className='size-4 text-success-foreground' />
          <h3 className='text-sm font-medium'>Safe to convert</h3>
        </div>
        <p className='text-sm'>
          By converting this lead, a new customer record will be created. The
          lead will be marked as &quot;Converted&quot; and will no longer appear
          in the active leads list.
        </p>
      </div>
      <input type='hidden' name='leadId' value={lead.id} />
      <FormActions
        resetFn={setClose}
        defaultButtonNames={false}
        actionButtonText='Convert'
        cancelButtonText='Close'
        isPending={isPending}
      />
    </form>
  );
}

function LeadItem({ title, value }: { title: string; value: string | null }) {
  return (
    <div className='flex flex-col'>
      <p className='text-sm font-medium text-muted-foreground'>{title}</p>
      <p className='text-sm'>{value ?? 'Not Specified'}</p>
    </div>
  );
}
