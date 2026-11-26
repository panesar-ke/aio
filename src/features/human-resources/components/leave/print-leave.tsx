'use client';

import { notify } from '@/components/custom/toast';
import { type LeaveBalance } from '@/features/human-resources/utils/leave/balance';
import { type LeaveRow } from '@/features/human-resources/utils/leave/leave.types';

const FRAME_ID = 'leave-print-frame';

/** Builds the application as a PDF and opens the browser's print dialog. */
export async function printLeave(
  leave: LeaveRow,
  balance: LeaveBalance | null,
) {
  try {
    // Loaded on demand: @react-pdf/renderer is large and rarely needed.
    const [{ pdf }, { LeavePdfDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/human-resources/components/leave/leave-pdf-document'),
    ]);
    const blob = await pdf(
      <LeavePdfDocument leave={leave} balance={balance} />,
    ).toBlob();

    // The frame must outlive the print dialog, so the last one is only removed
    // when the next printout replaces it.
    const previous = document.getElementById(FRAME_ID) as HTMLIFrameElement;
    if (previous) {
      URL.revokeObjectURL(previous.src);
      previous.remove();
    }

    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.title = 'Leave application printout';
    // Hidden with `display: none`, some browsers print a blank page.
    frame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.src = URL.createObjectURL(blob);
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (error) {
        console.error('Failed to open the print dialog:', error);
        notify.error('Print failed', 'Could not open the print dialog.');
      }
    };
    document.body.append(frame);
  } catch (error) {
    console.error('Failed to generate the leave printout:', error);
    notify.error('Print failed', 'Could not generate the printout.');
  }
}
