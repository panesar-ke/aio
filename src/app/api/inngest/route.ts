import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { sendSupplierPoEmail } from '@/inngest/functions/procurement';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendSupplierPoEmail],
});
