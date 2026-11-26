import { NonRetriableError } from 'inngest';

import { getLeaveDecisionSms } from '@/features/human-resources/services/leave/data';
import { inngest } from '@/inngest/client';
import { leaveDecidedEvent } from '@/inngest/events';
import { sendSms } from '@/lib/sms';

/** Africa's Talking codes for a message it has taken on: processed, sent, queued. */
const ACCEPTED_CODES = [100, 101, 102];
/** Invalid phone number and blacklisted user: retrying cannot succeed. */
const PERMANENT_CODES = [403, 406];

export const sendLeaveDecisionSms = inngest.createFunction(
  {
    id: 'send-leave-decision-sms',
    retries: 3,
    triggers: [leaveDecidedEvent],
  },
  async ({ event, step }) => {
    const { leaveNo } = event.data;

    const sms = await step.run('prepare-leave-decision-sms', () =>
      getLeaveDecisionSms(leaveNo),
    );

    if (!sms?.to) {
      const reason = sms ? 'no usable mobile number' : 'no decision to report';
      console.warn(`Leave ${leaveNo}: SMS not sent, ${reason}.`);
      return { sent: false, reason };
    }

    const to = sms.to;
    await step.run('send-leave-decision-sms', async () => {
      // sendSms logs and swallows errors, so check the response to get retries.
      const response = await sendSms({ to: [to], message: sms.message });
      const recipient = response?.SMSMessageData.Recipients[0];

      if (recipient && ACCEPTED_CODES.includes(recipient.statusCode)) return;

      const detail =
        recipient?.status ??
        response?.SMSMessageData.Message ??
        'no response from the gateway';
      const message = `Leave ${leaveNo}: SMS not accepted (${detail}).`;

      if (recipient && PERMANENT_CODES.includes(recipient.statusCode)) {
        throw new NonRetriableError(message);
      }
      throw new Error(message);
    });

    return { sent: true };
  },
);
