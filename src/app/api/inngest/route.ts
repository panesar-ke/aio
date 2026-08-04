import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { processProductImport } from "@/inngest/functions/products-import";
import { sendUserNewPassword } from "@/inngest/functions/users";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendUserNewPassword, processProductImport],
});
