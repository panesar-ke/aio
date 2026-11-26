import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { sendLeaveDecisionSms } from "@/inngest/functions/leave";
import { processProductImport } from "@/inngest/functions/products-import";
import { runStoreProductDeactivation } from "@/inngest/functions/store-product-deactivation";
import { sendUserNewPassword } from "@/inngest/functions/users";

export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendUserNewPassword,
    processProductImport,
    runStoreProductDeactivation,
    sendLeaveDecisionSms,
  ],
  streaming: true,
});
