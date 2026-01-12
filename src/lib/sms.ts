import africastalking from 'africastalking';
import { z } from 'zod';

const credentials = {
  apiKey: process.env.SMS_API_KEY as string,
  username: process.env.SMS_USER_NAME as string,
};

const AfricasTalking = africastalking(credentials);

const sms = AfricasTalking.SMS;

export const smsSchema = z.object({
  to: z.array(
    z.string().regex(/\+254\d{9}/, { message: 'Invalid phone number' })
  ),
  message: z.string(),
});

export async function sendSms(data: z.infer<typeof smsSchema>) {
  const options = {
    to: data.to,
    message: data.message,
    from: process.env.SMS_SENDER_ID as string,
  };

  try {
    const response = await sms.send(options);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error sending SMS🔥🔥`, error.message);
    }
  }
}
