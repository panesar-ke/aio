import { NonRetriableError } from 'inngest';
import { getPurchaseOrder } from '@/features/procurement/services/purchase-orders/data';
import { formatOrderForFileGeneration } from '@/features/procurement/utils/formatters';
import { inngest } from '@/inngest/client';
import { isValidEmail } from '@/lib/utils';
import {
  generateOrderFile,
  sendOrderEmailAction,
} from '@/features/procurement/services/purchase-orders/actions';
import { createNotification } from '@/features/global/services/actions';

export const sendSupplierPoEmail = inngest.createFunction(
  { id: 'send-supplier-po-email', retries: 0 },
  { event: 'procurement/supplier.po.email' },
  async ({ event, step }) => {
    const { orderId, userId } = event.data;

    // Helper function without step.run - just returns notification data
    const createErrorNotificationData = (title: string, message: string) => ({
      title,
      message,
      notificationType: 'error' as const,
      path: `/procurement/purchase-order/${orderId}/details`,
      userId,
      eventId: event.id,
    });

    let fileUrl: string | undefined;

    const data = await step.run('get-order-data', async () => {
      const order = await getPurchaseOrder(orderId);
      if (!order) {
        throw new NonRetriableError(
          `Purchase order with ID ${orderId} not found`
        );
      }
      return order;
    });

    if (!data.vendor.email) {
      throw new NonRetriableError(
        `Vendor ${data.vendor.vendorName} does not have an email address. Please update vendor information.`
      );
    }

    if (!isValidEmail(data.vendor.email)) {
      throw new NonRetriableError(
        `Vendor email "${data.vendor.email}" is invalid. Please update vendor information.`
      );
    }

    if (!data.fileUrl) {
      const formattedOrderDetails = formatOrderForFileGeneration(data);

      const fileGenResult = await step.run('generate-order-file', async () => {
        const res = await generateOrderFile(formattedOrderDetails, orderId);
        return res;
      });

      if (fileGenResult.error) {
        await step.run('create-file-gen-error-notification', async () => {
          await createNotification(
            createErrorNotificationData(
              'Error Generating PO File',
              fileGenResult.message
            )
          );
        });

        throw new NonRetriableError(
          `Failed to generate PO file: ${fileGenResult.message}`
        );
      }

      fileUrl = fileGenResult.data;
    }

    const emailResult = await step.run('send-email', async () => {
      const res = await sendOrderEmailAction(
        data.vendor.email as string,
        data.id,
        data.fileUrl || (fileUrl as string)
      );
      return res;
    });

    if (emailResult.error) {
      await step.run('create-email-error-notification', async () => {
        await createNotification(
          createErrorNotificationData(
            'Error Sending PO Email',
            emailResult.message
          )
        );
      });

      throw new NonRetriableError(
        `Failed to send email: ${emailResult.message}`
      );
    }

    // await step.run('create-success-notification', async () => {
    //   await createNotification({
    //     title: 'PO Email Sent Successfully',
    //     message: `Purchase order ${orderId} has been emailed to ${data.vendor.email}`,
    //     notificationType: 'success',
    //     path: `/procurement/purchase-order/${orderId}/details`,
    //     userId,
    //     eventId: event.id,
    //   });
    // });

    return {
      message: `PO email sent successfully to ${data.vendor.email}`,
    };
  }
);
