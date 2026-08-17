import { inngest } from '@/inngest/client';
import { sendNewPasswordEvent } from '@/inngest/events';
import { sendSms } from '@/lib/sms';

export const sendUserNewPassword = inngest.createFunction(
  {
    id: 'send-new-user-password',
    triggers: [sendNewPasswordEvent],
  },
  async ({ event, step }) => {
    const { contact, password, name } = event.data;

    await step.run('send-new-password-sms', async () => {
      await sendSms({
        message: `Dear ${name}, your password is: ${password} \n You will be required to change this after first login.`,
        to: [contact],
      });
    });
  },
);
